import {describe, expect, it, vi} from 'vitest'

import {createDatabaseEditorialPublishingRepository} from './database-publishing-repository'

const entityId = '9973ebcd-581d-427f-a23a-9e77fb008f52'
const revisionId = 'f60a4720-9bc7-46b1-a65d-bd194be2fac0'
const actorUserId = '084df664-a286-4cfa-bc4c-5021aaeaeb31'
const publishedAt = new Date('2026-08-10T12:00:00.000Z')

function database() {
  const transaction = {
    artwork: {
      findUnique: vi.fn().mockResolvedValue({
        id: entityId,
        locale: 'en',
        publishedAt,
        slug: 'silent-steppe',
        status: 'PUBLISHED',
        version: 3,
      }),
      updateMany: vi.fn().mockResolvedValue({count: 1}),
    },
    auditEvent: {create: vi.fn().mockResolvedValue({id: 'audit-1'})},
    contentMediaPlacement: {
      findMany: vi.fn().mockResolvedValue([{role: 'HERO'}]),
    },
    contentRevision: {
      create: vi.fn().mockImplementation(({data}) => ({
        ...data,
        id: revisionId,
      })),
      findFirst: vi.fn().mockResolvedValue({
        actorUserId,
        createdAt: publishedAt,
        entityId,
        entityType: 'ARTWORK',
        id: revisionId,
        locale: 'en',
        operation: 'PUBLISH',
        snapshot: {title: 'Published title'},
        sourceRevisionId: null,
        version: 2,
      }),
      findUnique: vi.fn(),
    },
    outboxJob: {create: vi.fn().mockResolvedValue({id: 'job-1'})},
  }
  const root = {
    $transaction: vi.fn(async callback => callback(transaction)),
  }

  return {root, transaction}
}

function repositoryFixture(overrides: Record<string, unknown> = {}) {
  const fixture = database()
  const codecs = {
    ARTWORK: {
      delegate: 'artwork' as const,
      draftSnapshot: vi.fn().mockReturnValue({title: 'Unpublished edit'}),
    },
    ...overrides,
  }
  const repository = createDatabaseEditorialPublishingRepository(
    fixture.root,
    codecs,
  )

  return {...fixture, codecs, repository}
}

describe('database editorial publishing repository', () => {
  it('loads the draft from the entity but the public snapshot from an immutable revision', async () => {
    const {repository, transaction} = repositoryFixture()

    const aggregate = await repository.withTransaction(current =>
      current.findAggregate({entityId, entityType: 'ARTWORK'}),
    )

    expect(aggregate).toMatchObject({
      draftSnapshot: {title: 'Unpublished edit'},
      publishedSnapshot: {title: 'Published title'},
      status: 'PUBLISHED',
      version: 3,
    })
    expect(transaction.contentRevision.findFirst).toHaveBeenCalledWith({
      orderBy: {version: 'desc'},
      where: {entityId, entityType: 'ARTWORK'},
    })
    expect(aggregate?.publishedSnapshot).not.toEqual(aggregate?.draftSnapshot)
  })

  it('returns no public snapshot when lifecycle state is not published', async () => {
    const fixture = repositoryFixture()

    fixture.transaction.artwork.findUnique.mockResolvedValueOnce({
      id: entityId,
      locale: 'en',
      publishedAt: null,
      slug: 'silent-steppe',
      status: 'DRAFT',
      version: 1,
    })

    const aggregate = await fixture.repository.withTransaction(current =>
      current.findAggregate({entityId, entityType: 'ARTWORK'}),
    )

    expect(aggregate?.publishedSnapshot).toBeNull()
    expect(fixture.transaction.contentRevision.findFirst).not.toHaveBeenCalled()
  })

  it('persists revision, CAS state, audit and revalidation job through one transaction', async () => {
    const fixture = repositoryFixture()

    await fixture.repository.withTransaction(async current => {
      await current.createRevision({
        actorUserId,
        createdAt: publishedAt,
        entityId,
        entityType: 'ARTWORK',
        locale: 'en',
        operation: 'PUBLISH',
        snapshot: {title: 'Published title'},
        sourceRevisionId: null,
        version: 4,
      })
      await current.updatePublishedState({
        entityId,
        entityType: 'ARTWORK',
        expectedVersion: 3,
        nextVersion: 4,
        publishedAt,
        publishedSnapshot: {title: 'Published title'},
        status: 'PUBLISHED',
      })
      await current.createAuditEvent({
        action: 'editorial.published',
        actorUserId,
        entityId,
        entityType: 'ARTWORK',
        metadata: {toVersion: 4},
      })
      await current.enqueueCacheRevalidation({
        idempotencyKey: `editorial.cache-revalidate:ARTWORK:${entityId}:v4`,
        maxAttempts: 5,
        payload: {
          entityId,
          entityType: 'ARTWORK',
          locale: 'en',
          paths: ['/en/works/silent-steppe'],
          version: 4,
        },
        type: 'editorial.cache-revalidate',
      })
    })

    expect(fixture.root.$transaction).toHaveBeenCalledOnce()
    expect(fixture.transaction.contentRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({snapshot: {title: 'Published title'}}),
    })
    expect(fixture.transaction.artwork.updateMany).toHaveBeenCalledWith({
      data: {publishedAt, status: 'PUBLISHED', version: 4},
      where: {id: entityId, version: 3},
    })
    expect(fixture.transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'editorial.published',
        actorUserId,
        entityId,
        entityType: 'ARTWORK',
      }),
    })
    expect(fixture.transaction.outboxJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: `editorial.cache-revalidate:ARTWORK:${entityId}:v4`,
        maxAttempts: 5,
        type: 'editorial.cache-revalidate',
      }),
    })
  })

  it('returns null when the optimistic state transition loses its version race', async () => {
    const fixture = repositoryFixture()

    fixture.transaction.artwork.updateMany.mockResolvedValueOnce({count: 0})

    await expect(
      fixture.repository.withTransaction(current =>
        current.updatePublishedState({
          entityId,
          entityType: 'ARTWORK',
          expectedVersion: 3,
          nextVersion: 4,
          publishedAt,
          publishedSnapshot: {title: 'Published title'},
          status: 'PUBLISHED',
        }),
      ),
    ).resolves.toBeNull()
  })

  it('fails closed for unsupported entities and malformed database rows', async () => {
    const fixture = repositoryFixture()

    await expect(
      fixture.repository.withTransaction(current =>
        current.findAggregate({entityId, entityType: 'PAGE'}),
      ),
    ).rejects.toThrow('EDITORIAL_PERSISTENCE_ENTITY_UNSUPPORTED')

    fixture.transaction.artwork.findUnique.mockResolvedValueOnce({
      id: entityId,
      locale: 'de',
      publishedAt: null,
      slug: 'invalid',
      status: 'DRAFT',
      version: 1,
    })

    await expect(
      fixture.repository.withTransaction(current =>
        current.findAggregate({entityId, entityType: 'ARTWORK'}),
      ),
    ).rejects.toThrow('EDITORIAL_PERSISTENCE_ROW_INVALID')
  })

  it('returns null for missing aggregates and withholds a missing published revision', async () => {
    const fixture = repositoryFixture()

    fixture.transaction.artwork.findUnique.mockResolvedValueOnce(null)
    await expect(
      fixture.repository.withTransaction(current =>
        current.findAggregate({entityId, entityType: 'ARTWORK'}),
      ),
    ).resolves.toBeNull()

    fixture.transaction.contentRevision.findFirst.mockResolvedValueOnce(null)
    const aggregate = await fixture.repository.withTransaction(current =>
      current.findAggregate({entityId, entityType: 'ARTWORK'}),
    )

    expect(aggregate?.publishedSnapshot).toBeNull()
  })

  it('rejects a mismatched row identity and a misconfigured delegate', async () => {
    const fixture = repositoryFixture()

    fixture.transaction.artwork.findUnique.mockResolvedValueOnce({
      id: '827a061c-dbf6-4ae6-afcb-9f3666a5ff69',
      locale: 'en',
      publishedAt: null,
      slug: 'silent-steppe',
      status: 'DRAFT',
      version: 1,
    })
    await expect(
      fixture.repository.withTransaction(current =>
        current.findAggregate({entityId, entityType: 'ARTWORK'}),
      ),
    ).rejects.toThrow('EDITORIAL_PERSISTENCE_ROW_INVALID')

    const broken = repositoryFixture({
      ARTWORK: {
        delegate: 'missing',
        draftSnapshot: vi.fn(),
      },
    })

    await expect(
      broken.repository.withTransaction(current =>
        current.findAggregate({entityId, entityType: 'ARTWORK'}),
      ),
    ).rejects.toThrow('EDITORIAL_PERSISTENCE_CONFIGURATION_INVALID')
  })

  it('finds only revisions that belong to the requested aggregate', async () => {
    const fixture = repositoryFixture()
    const reference = {entityId, entityType: 'ARTWORK' as const, revisionId}

    fixture.transaction.contentRevision.findUnique.mockResolvedValueOnce(null)
    await expect(
      fixture.repository.withTransaction(current =>
        current.findRevision(reference),
      ),
    ).resolves.toBeNull()

    fixture.transaction.contentRevision.findUnique.mockResolvedValueOnce({
      actorUserId,
      createdAt: publishedAt,
      entityId,
      entityType: 'ARTWORK',
      id: revisionId,
      locale: 'en',
      operation: 'PUBLISH',
      snapshot: {title: 'Published title'},
      sourceRevisionId: null,
      version: 2,
    })
    await expect(
      fixture.repository.withTransaction(current =>
        current.findRevision(reference),
      ),
    ).resolves.toMatchObject({id: revisionId})

    fixture.transaction.contentRevision.findUnique.mockResolvedValueOnce({
      actorUserId,
      createdAt: publishedAt,
      entityId: '827a061c-dbf6-4ae6-afcb-9f3666a5ff69',
      entityType: 'ARTWORK',
      id: revisionId,
      locale: 'en',
      operation: 'PUBLISH',
      snapshot: {title: 'Published title'},
      sourceRevisionId: null,
      version: 2,
    })
    await expect(
      fixture.repository.withTransaction(current =>
        current.findRevision(reference),
      ),
    ).resolves.toBeNull()
  })

  it('fails closed when a created or loaded revision does not match the schema', async () => {
    const fixture = repositoryFixture()

    fixture.transaction.contentRevision.create.mockResolvedValueOnce({
      id: revisionId,
      snapshot: {},
    })

    await expect(
      fixture.repository.withTransaction(current =>
        current.createRevision({
          actorUserId,
          createdAt: publishedAt,
          entityId,
          entityType: 'ARTWORK',
          locale: 'en',
          operation: 'PUBLISH',
          snapshot: {title: 'Published title'},
          sourceRevisionId: null,
          version: 4,
        }),
      ),
    ).rejects.toThrow('EDITORIAL_PERSISTENCE_REVISION_INVALID')
  })
})
