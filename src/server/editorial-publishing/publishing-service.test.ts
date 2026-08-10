import {describe, expect, it, vi} from 'vitest'

import {
  EditorialContentNotFoundError,
  EditorialRevisionNotFoundError,
  EditorialVersionConflictError,
} from './publishing-errors'
import {createEditorialPublishingService} from './publishing-service'

const actorUserId = '084df664-a286-4cfa-bc4c-5021aaeaeb31'
const entityId = '9973ebcd-581d-427f-a23a-9e77fb008f52'
const now = new Date('2026-08-10T12:00:00.000Z')
const revisionId = 'f60a4720-9bc7-46b1-a65d-bd194be2fac0'

function aggregate(overrides: Record<string, unknown> = {}) {
  return {
    draftSnapshot: {
      description: 'A complete editorial description for publication.',
      nested: {keywords: ['steppe', 'memory']},
      title: 'Silent Steppe — revised',
    },
    entityId,
    entityType: 'ARTWORK' as const,
    locale: 'en' as const,
    publishedAt: new Date('2026-08-01T12:00:00.000Z'),
    publishedSnapshot: {title: 'Silent Steppe'},
    slug: 'silent-steppe',
    status: 'PUBLISHED' as const,
    version: 3,
    ...overrides,
  }
}

function revision(overrides: Record<string, unknown> = {}) {
  return {
    actorUserId,
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    entityId,
    entityType: 'ARTWORK' as const,
    id: revisionId,
    locale: 'en' as const,
    operation: 'PUBLISH' as const,
    snapshot: {title: 'Historical title'},
    sourceRevisionId: null,
    version: 1,
    ...overrides,
  }
}

function configuredRepository(
  options: {
    content?: ReturnType<typeof aggregate> | null
    historicalRevision?: ReturnType<typeof revision> | null
    concurrentUpdate?: boolean
  } = {},
) {
  const events: string[] = []
  const content = options.content === undefined ? aggregate() : options.content
  const historicalRevision =
    options.historicalRevision === undefined
      ? revision()
      : options.historicalRevision
  const transaction = {
    createAuditEvent: vi.fn(async () => {
      events.push('audit')
    }),
    createRevision: vi.fn(async input => {
      events.push('revision')

      return {
        actorUserId: input.actorUserId,
        createdAt: input.createdAt,
        entityId: input.entityId,
        entityType: input.entityType,
        id: '827a061c-dbf6-4ae6-afcb-9f3666a5ff69',
        locale: input.locale,
        operation: input.operation,
        snapshot: input.snapshot,
        sourceRevisionId: input.sourceRevisionId,
        version: input.version,
      }
    }),
    enqueueCacheRevalidation: vi.fn(async () => {
      events.push('revalidation')
    }),
    findAggregate: vi.fn(async () => {
      events.push('load-aggregate')

      return content
    }),
    findRevision: vi.fn(async () => {
      events.push('load-revision')

      return historicalRevision
    }),
    updatePublishedState: vi.fn(async input => {
      events.push('publish-state')

      if (options.concurrentUpdate) return null

      return aggregate({
        draftSnapshot: input.publishedSnapshot,
        publishedAt: input.publishedAt,
        publishedSnapshot: input.publishedSnapshot,
        status: 'PUBLISHED',
        version: input.nextVersion,
      })
    }),
  }
  const repository = {
    withTransaction: vi.fn(async callback => callback(transaction)),
  }
  const validateAggregate = vi.fn(async ({snapshot}) => snapshot)
  const service = createEditorialPublishingService(repository, {
    now: () => now,
    validateAggregate,
  })

  return {events, repository, service, transaction, validateAggregate}
}

const publicationCommand = {
  actorUserId,
  entityId,
  entityType: 'ARTWORK' as const,
  expectedVersion: 3,
  revalidationPaths: ['/en/works', '/en/works/silent-steppe'],
}

describe('editorial publish transaction', () => {
  it('validates, revisions, publishes, audits and enqueues in one transaction', async () => {
    const configured = configuredRepository()

    const result = await configured.service.publish(publicationCommand)

    expect(configured.repository.withTransaction).toHaveBeenCalledOnce()
    expect(configured.events).toEqual([
      'load-aggregate',
      'revision',
      'publish-state',
      'audit',
      'revalidation',
    ])
    expect(configured.validateAggregate).toHaveBeenCalledWith({
      entityId,
      entityType: 'ARTWORK',
      locale: 'en',
      slug: 'silent-steppe',
      snapshot: expect.objectContaining({title: 'Silent Steppe — revised'}),
    })
    expect(configured.transaction.createRevision).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId,
        createdAt: now,
        entityId,
        entityType: 'ARTWORK',
        locale: 'en',
        operation: 'PUBLISH',
        sourceRevisionId: null,
        version: 4,
      }),
    )
    expect(configured.transaction.updatePublishedState).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId,
        entityType: 'ARTWORK',
        expectedVersion: 3,
        nextVersion: 4,
        publishedAt: now,
      }),
    )
    expect(configured.transaction.createAuditEvent).toHaveBeenCalledWith({
      action: 'editorial.published',
      actorUserId,
      entityId,
      entityType: 'ARTWORK',
      metadata: {
        fromVersion: 3,
        revisionId: '827a061c-dbf6-4ae6-afcb-9f3666a5ff69',
        toVersion: 4,
      },
    })
    expect(
      configured.transaction.enqueueCacheRevalidation,
    ).toHaveBeenCalledWith({
      idempotencyKey: `editorial.cache-revalidate:ARTWORK:${entityId}:v4`,
      maxAttempts: 5,
      payload: {
        entityId,
        entityType: 'ARTWORK',
        locale: 'en',
        paths: ['/en/works', '/en/works/silent-steppe'],
        version: 4,
      },
      type: 'editorial.cache-revalidate',
    })
    expect(result.aggregate.version).toBe(4)
    expect(result.revision.version).toBe(4)
  })

  it('creates detached, deeply immutable publication snapshots', async () => {
    const source = aggregate()
    const configured = configuredRepository({content: source})

    await configured.service.publish(publicationCommand)

    const revisionInput = configured.transaction.createRevision.mock.calls[0][0]
    const publishedInput =
      configured.transaction.updatePublishedState.mock.calls[0][0]

    expect(revisionInput.snapshot).not.toBe(source.draftSnapshot)
    expect(revisionInput.snapshot).toBe(publishedInput.publishedSnapshot)
    expect(Object.isFrozen(revisionInput.snapshot)).toBe(true)
    expect(Object.isFrozen(revisionInput.snapshot.nested)).toBe(true)
    expect(Object.isFrozen(revisionInput.snapshot.nested.keywords)).toBe(true)
    expect(() => {
      ;(revisionInput.snapshot.nested.keywords as string[]).push('mutation')
    }).toThrow()
  })

  it('fails without side effects when content is missing', async () => {
    const configured = configuredRepository({content: null})

    await expect(
      configured.service.publish(publicationCommand),
    ).rejects.toBeInstanceOf(EditorialContentNotFoundError)
    expect(configured.transaction.createRevision).not.toHaveBeenCalled()
  })

  it('fails before validation and writes on a stale expected version', async () => {
    const configured = configuredRepository()

    await expect(
      configured.service.publish({...publicationCommand, expectedVersion: 2}),
    ).rejects.toBeInstanceOf(EditorialVersionConflictError)
    expect(configured.validateAggregate).not.toHaveBeenCalled()
    expect(configured.transaction.createRevision).not.toHaveBeenCalled()
  })

  it('relies on transaction rollback when a concurrent update wins', async () => {
    const configured = configuredRepository({concurrentUpdate: true})

    await expect(
      configured.service.publish(publicationCommand),
    ).rejects.toBeInstanceOf(EditorialVersionConflictError)
    expect(configured.transaction.createAuditEvent).not.toHaveBeenCalled()
    expect(
      configured.transaction.enqueueCacheRevalidation,
    ).not.toHaveBeenCalled()
  })

  it('does not write when aggregate validation fails', async () => {
    const configured = configuredRepository()

    configured.validateAggregate.mockRejectedValueOnce(
      new Error('Editorial description is incomplete'),
    )

    await expect(
      configured.service.publish(publicationCommand),
    ).rejects.toThrow('Editorial description is incomplete')
    expect(configured.transaction.createRevision).not.toHaveBeenCalled()
  })

  it.each([
    {paths: []},
    {
      paths: Array.from({length: 21}, (_, index) => `/en/path-${index}`),
    },
    {paths: ['/en/works?draft=true']},
    {paths: ['/en/works draft']},
    {paths: ['/en//works']},
    {paths: ['/en/%2e%2e/studio']},
    {paths: ['https://bekten.art/en/works']},
    {paths: ['/en/works', '/en/works']},
  ])(
    'rejects unsafe or unbounded revalidation paths: $paths',
    async ({paths}) => {
      const configured = configuredRepository()

      await expect(
        configured.service.publish({
          ...publicationCommand,
          revalidationPaths: paths,
        }),
      ).rejects.toThrow()
      expect(configured.repository.withTransaction).not.toHaveBeenCalled()
    },
  )

  it.each([0, 2_147_483_647])(
    'rejects an unsafe source version before opening a transaction: %i',
    async expectedVersion => {
      const configured = configuredRepository()

      await expect(
        configured.service.publish({...publicationCommand, expectedVersion}),
      ).rejects.toThrow()
      expect(configured.repository.withTransaction).not.toHaveBeenCalled()
    },
  )
})

describe('editorial restore transaction', () => {
  it('restores a historical snapshot as a new monotonically increasing revision', async () => {
    const historical = revision({
      snapshot: {nested: {edition: 1}, title: 'First published title'},
      version: 1,
    })
    const configured = configuredRepository({historicalRevision: historical})

    const result = await configured.service.restore({
      ...publicationCommand,
      revisionId,
    })

    expect(configured.events).toEqual([
      'load-aggregate',
      'load-revision',
      'revision',
      'publish-state',
      'audit',
      'revalidation',
    ])
    expect(configured.transaction.createRevision).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'RESTORE',
        snapshot: {nested: {edition: 1}, title: 'First published title'},
        sourceRevisionId: revisionId,
        version: 4,
      }),
    )
    expect(configured.transaction.createAuditEvent).toHaveBeenCalledWith({
      action: 'editorial.restored',
      actorUserId,
      entityId,
      entityType: 'ARTWORK',
      metadata: {
        fromVersion: 3,
        revisionId: '827a061c-dbf6-4ae6-afcb-9f3666a5ff69',
        sourceRevisionId: revisionId,
        sourceVersion: 1,
        toVersion: 4,
      },
    })
    expect(result.revision.version).toBe(4)
    expect(result.revision.sourceRevisionId).toBe(revisionId)
    expect(historical).toEqual(
      revision({
        snapshot: {nested: {edition: 1}, title: 'First published title'},
        version: 1,
      }),
    )
  })

  it.each([
    null,
    revision({id: '4a7aa7c8-28d4-4fb2-8edf-55697f45a1fe'}),
    revision({entityId: 'a0a5845e-f8f8-4c93-b2ec-7ee76300fc41'}),
    revision({entityType: 'COLLECTION'}),
    revision({version: 4}),
  ])('rejects a missing or unrelated source revision: %o', async historical => {
    const configured = configuredRepository({historicalRevision: historical})

    await expect(
      configured.service.restore({...publicationCommand, revisionId}),
    ).rejects.toBeInstanceOf(EditorialRevisionNotFoundError)
    expect(configured.transaction.createRevision).not.toHaveBeenCalled()
  })

  it('validates the historical snapshot before restoring it', async () => {
    const configured = configuredRepository()

    configured.validateAggregate.mockRejectedValueOnce(
      new Error('Historical snapshot is no longer publishable'),
    )

    await expect(
      configured.service.restore({...publicationCommand, revisionId}),
    ).rejects.toThrow('Historical snapshot is no longer publishable')
    expect(configured.transaction.createRevision).not.toHaveBeenCalled()
  })
})
