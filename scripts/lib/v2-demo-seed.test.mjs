import {describe, expect, it, vi} from 'vitest'

import {
  assertDemoSeedAllowed,
  createDemoSeedPlan,
  executeDemoSeedPlan,
} from './v2-demo-seed.mjs'

const mediaId = '20000000-0000-4000-8000-000000000001'
const entityId = '10000000-0000-4000-8000-000000000001'
const allowedEnvironment = Object.freeze({
  ALLOW_V2_DEMO_SEED: 'true',
  V2_DEMO_SEED_CONFIRMATION: 'bekten-art-v2-demo',
})
const content = Object.freeze({
  delegate: 'artwork',
  entityId,
  entityType: 'ARTWORK',
  identity: 'ARTWORK:en:demo-work',
  placements: Object.freeze([
    Object.freeze({
      altText: 'A demo artwork used to validate the editorial layout',
      caption: null,
      credit: 'Bekten Studio demo',
      crop: 'ORIGINAL',
      displayOrder: 0,
      entityId,
      entityType: 'ARTWORK',
      focalPoint: null,
      id: '40000000-0000-4000-8000-000000000001',
      mediaObjectId: mediaId,
      role: 'HERO',
    }),
  ]),
  revision: Object.freeze({
    entityId,
    entityType: 'ARTWORK',
    id: '30000000-0000-4000-8000-000000000001',
    locale: 'en',
    operation: 'PUBLISH',
    snapshot: Object.freeze({
      availability: 'ON_REQUEST',
      description: 'A demo artwork description long enough for the contract.',
      displayOrder: 0,
      locale: 'en',
      mediaPlacements: Object.freeze([]),
      seo: Object.freeze({
        canonicalPath: '/en/works/demo-work',
        description: 'A replaceable Bekten Studio demo artwork.',
        noIndex: false,
        title: 'Demo work — Bekten Studio',
      }),
      slug: 'demo-work',
      title: 'Demo work',
    }),
    version: 1,
  }),
  segment: 'works',
  row: Object.freeze({
    description: 'A demo artwork description long enough for the contract.',
    displayOrder: 0,
    id: entityId,
    locale: 'en',
    publishedAt: new Date('2026-08-11T00:00:00.000Z'),
    slug: 'demo-work',
    status: 'PUBLISHED',
    title: 'Demo work',
    version: 1,
  }),
})
const media = Object.freeze({
  assetPath: 'public/img/art/art-0.png',
  checksumSha256: 'a'.repeat(64),
  filename: 'demo-work.png',
  height: 228,
  id: mediaId,
  mimeType: 'image/png',
  objectKey: 'v2-demo/artworks/demo-work.png',
  sizeBytes: 100,
  width: 176,
})

function databaseFixture({contentCreated = true, existingMedia = []} = {}) {
  const delegates = Object.fromEntries(
    [
      'artwork',
      'collection',
      'exhibition',
      'journalEntry',
      'page',
      'pressItem',
    ].map(name => [
      name,
      {
        createMany: vi.fn().mockResolvedValue({count: contentCreated ? 1 : 0}),
        findUnique: vi.fn().mockResolvedValue({id: entityId, version: 8}),
      },
    ]),
  )
  const transaction = {
    ...delegates,
    auditEvent: {create: vi.fn().mockResolvedValue({id: 'audit-1'})},
    contentMediaPlacement: {
      createMany: vi.fn().mockResolvedValue({count: 1}),
    },
    contentRevision: {createMany: vi.fn().mockResolvedValue({count: 1})},
    outboxJob: {create: vi.fn().mockResolvedValue({id: 'outbox-1'})},
  }
  const database = {
    $transaction: vi.fn(callback => callback(transaction)),
    mediaObject: {
      createMany: vi.fn().mockResolvedValue({count: 1}),
      findMany: vi.fn().mockResolvedValue(existingMedia),
      updateMany: vi.fn().mockResolvedValue({count: 1}),
    },
  }

  return {database, transaction}
}

describe('V2 demo seed', () => {
  it('requires an explicit double confirmation in every environment', () => {
    expect(() => assertDemoSeedAllowed({NODE_ENV: 'production'})).toThrow(
      'V2_DEMO_SEED_NOT_AUTHORIZED',
    )
    expect(() =>
      assertDemoSeedAllowed({
        ALLOW_V2_DEMO_SEED: 'true',
        NODE_ENV: 'production',
      }),
    ).toThrow('V2_DEMO_SEED_NOT_AUTHORIZED')
    expect(() =>
      assertDemoSeedAllowed({
        ALLOW_V2_DEMO_SEED: 'true',
        NODE_ENV: 'production',
        V2_DEMO_SEED_CONFIRMATION: 'bekten-art-v2-demo',
      }),
    ).not.toThrow()
    expect(() => assertDemoSeedAllowed({NODE_ENV: 'development'})).toThrow(
      'V2_DEMO_SEED_NOT_AUTHORIZED',
    )
    expect(() =>
      assertDemoSeedAllowed({
        ALLOW_V2_DEMO_SEED: 'true',
        NODE_ENV: 'development',
      }),
    ).toThrow('V2_DEMO_SEED_NOT_AUTHORIZED')
    expect(() =>
      assertDemoSeedAllowed({
        ...allowedEnvironment,
        NODE_ENV: 'development',
      }),
    ).not.toThrow()
  })

  it('builds deterministic, price-free content for all locales and editorial types', () => {
    const plan = createDemoSeedPlan()
    const identities = plan.content.map(item => item.identity)

    expect(new Set(identities).size).toBe(identities.length)
    expect(new Set(plan.content.map(item => item.row.locale))).toEqual(
      new Set(['en', 'tr', 'ru', 'ky']),
    )
    expect(new Set(plan.content.map(item => item.entityType))).toEqual(
      new Set([
        'ARTWORK',
        'COLLECTION',
        'EXHIBITION',
        'JOURNAL_ENTRY',
        'PAGE',
        'PRESS_ENTRY',
      ]),
    )
    expect(JSON.stringify(plan)).not.toMatch(/priceMinor|currency/u)
    expect(
      plan.content
        .filter(item => item.row.locale === 'en')
        .every(
          item =>
            !item.row.seoCanonicalPath.startsWith('/en') &&
            !item.revision.snapshot.seo.canonicalPath.startsWith('/en'),
        ),
    ).toBe(true)
    expect(
      plan.content
        .filter(item => item.entityType === 'ARTWORK')
        .every(item =>
          item.revision.snapshot.mediaPlacements.some(
            placement => placement.role === 'HERO',
          ),
        ),
    ).toBe(true)
    expect(
      plan.content.every(item =>
        item.placements.every(
          placement => placement.altText === item.row.title,
        ),
      ),
    ).toBe(true)
  })

  it('maps generated heritage assets to the intended editable Studio records', () => {
    const plan = createDemoSeedPlan()
    const mediaById = new Map(plan.media.map(item => [item.id, item]))
    const assetFor = identity => {
      const item = plan.content.find(
        candidate => candidate.identity === identity,
      )
      const mediaObjectId = item?.placements[0]?.mediaObjectId

      return mediaById.get(mediaObjectId)?.assetPath
    }

    expect(plan.media.map(item => item.assetPath)).toEqual(
      expect.arrayContaining([
        'public/img/heritage-collection-hero.jpg',
        'public/img/heritage-landscape-hero.jpg',
        'public/img/heritage-returning-home.jpg',
        'public/img/heritage-studio-hero.jpg',
        'public/img/heritage-three-voices.jpg',
      ]),
    )
    expect(assetFor('COLLECTION:en:archive-of-earth')).toBe(
      'public/img/heritage-collection-hero.jpg',
    )
    expect(assetFor('ARTWORK:en:silent-steppe')).toBe(
      'public/img/heritage-landscape-hero.jpg',
    )
    expect(assetFor('ARTWORK:en:earth-script')).toBe(
      'public/img/heritage-three-voices.jpg',
    )
    expect(assetFor('ARTWORK:en:winter-light')).toBe(
      'public/img/heritage-returning-home.jpg',
    )
    expect(assetFor('PAGE:en:studio')).toBe(
      'public/img/heritage-studio-hero.jpg',
    )
  })

  it('uses source-grounded public context without private legacy contact data', () => {
    const serialized = JSON.stringify(createDemoSeedPlan())
    const artist = createDemoSeedPlan().content.find(
      item => item.identity === 'PAGE:en:artist',
    )
    const exhibition = createDemoSeedPlan().content.find(
      item => item.identity === 'EXHIBITION:en:earth-memory',
    )

    expect(artist?.row.body).toMatch(/1958/u)
    expect(artist?.row.body).toMatch(/Repin/u)
    expect(exhibition?.row.body).toMatch(/36 paintings/u)
    expect(exhibition?.row.venue).toBe('Al Hayat Gallery')
    expect(serialized).not.toMatch(/gmail\.com|Tynystanov|Тыныстанов/iu)
  })

  it('uploads deterministic assets and creates published rows, placements, revision and audit atomically', async () => {
    const configured = databaseFixture()
    const uploadAsset = vi.fn().mockResolvedValue(undefined)

    const result = await executeDemoSeedPlan({
      content: [content],
      database: configured.database,
      environment: allowedEnvironment,
      media: [media],
      uploadAsset,
    })

    expect(uploadAsset).toHaveBeenCalledWith(media)
    expect(configured.database.mediaObject.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          id: mediaId,
          objectKey: media.objectKey,
          provider: 'garage',
          status: 'READY',
          visibility: 'PUBLIC',
        }),
      ],
      skipDuplicates: true,
    })
    expect(configured.transaction.artwork.createMany).toHaveBeenCalledWith({
      data: [content.row],
      skipDuplicates: true,
    })
    expect(
      configured.transaction.contentMediaPlacement.createMany,
    ).toHaveBeenCalledWith({data: content.placements, skipDuplicates: true})
    expect(
      configured.transaction.contentRevision.createMany,
    ).toHaveBeenCalledWith({data: [content.revision], skipDuplicates: true})
    expect(configured.transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'editorial.demo-seeded',
        entityId,
        entityType: 'ARTWORK',
      }),
    })
    expect(configured.transaction.outboxJob.create).toHaveBeenCalledWith({
      data: {
        idempotencyKey: `editorial.cache-revalidate:ARTWORK:${entityId}:v1`,
        maxAttempts: 5,
        payload: {
          entityId,
          entityType: 'ARTWORK',
          locale: 'en',
          paths: ['/', '/works', '/works/demo-work'],
          version: 1,
        },
        type: 'editorial.cache-revalidate',
      },
    })
    expect(result).toEqual({created: 1, existing: 0, media: 1})
  })

  it('never overwrites a Studio-edited identity and rejects media identity conflicts', async () => {
    const configured = databaseFixture({contentCreated: false})

    await expect(
      executeDemoSeedPlan({
        content: [content],
        database: configured.database,
        environment: allowedEnvironment,
        media: [media],
        uploadAsset: vi.fn().mockResolvedValue(undefined),
      }),
    ).resolves.toEqual({created: 0, existing: 1, media: 1})
    expect(
      configured.transaction.contentMediaPlacement.createMany,
    ).not.toHaveBeenCalled()
    expect(
      configured.transaction.contentRevision.createMany,
    ).not.toHaveBeenCalled()
    expect(configured.transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'editorial.demo-seed-skipped',
        entityId,
        metadata: expect.objectContaining({preservedVersion: 8}),
      }),
    })

    configured.database.mediaObject.findMany.mockResolvedValueOnce([
      {...media, id: '20000000-0000-4000-8000-000000000099'},
    ])
    await expect(
      executeDemoSeedPlan({
        content: [],
        database: configured.database,
        environment: allowedEnvironment,
        media: [media],
        uploadAsset: vi.fn(),
      }),
    ).rejects.toThrow('V2_DEMO_MEDIA_IDENTITY_CONFLICT')
  })

  it('preserves a seeded record after an editor changes its slug', async () => {
    const configured = databaseFixture({contentCreated: false})

    configured.transaction.artwork.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({id: entityId, version: 11})

    await expect(
      executeDemoSeedPlan({
        content: [content],
        database: configured.database,
        environment: allowedEnvironment,
        media: [media],
        uploadAsset: vi.fn().mockResolvedValue(undefined),
      }),
    ).resolves.toEqual({created: 0, existing: 1, media: 1})
    expect(configured.transaction.artwork.findUnique).toHaveBeenNthCalledWith(
      2,
      {select: {id: true, version: true}, where: {id: entityId}},
    )
    expect(configured.transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'editorial.demo-seed-skipped',
        entityId,
        metadata: expect.objectContaining({preservedVersion: 11}),
      }),
    })
  })

  it('repairs an existing Garage media row after the object is verified', async () => {
    const staleMedia = {
      ...media,
      checksumSha256: '0'.repeat(64),
      filename: 'stale.png',
      originalFilename: 'stale.png',
      provider: 'garage',
      status: 'QUARANTINED',
      visibility: 'PRIVATE',
    }
    const configured = databaseFixture({existingMedia: [staleMedia]})
    const uploadAsset = vi.fn().mockResolvedValue(undefined)

    await expect(
      executeDemoSeedPlan({
        content: [],
        database: configured.database,
        environment: allowedEnvironment,
        media: [media],
        uploadAsset,
      }),
    ).resolves.toEqual({created: 0, existing: 0, media: 1})
    expect(uploadAsset).toHaveBeenCalledBefore(
      configured.database.mediaObject.updateMany,
    )
    expect(configured.database.mediaObject.updateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({
        checksumSha256: media.checksumSha256,
        filename: media.filename,
        provider: 'garage',
        status: 'READY',
        visibility: 'PUBLIC',
      }),
      where: {id: media.id, objectKey: media.objectKey},
    })

    configured.database.mediaObject.updateMany.mockResolvedValueOnce({count: 0})
    await expect(
      executeDemoSeedPlan({
        content: [],
        database: configured.database,
        environment: allowedEnvironment,
        media: [media],
        uploadAsset,
      }),
    ).rejects.toThrow('V2_DEMO_MEDIA_REPAIR_CONFLICT')
  })

  it('redacts unexpected database failures', async () => {
    const configured = databaseFixture()

    configured.database.mediaObject.findMany.mockRejectedValueOnce(
      new Error('postgres password secret-db-value'),
    )

    const failure = await executeDemoSeedPlan({
      content: [],
      database: configured.database,
      environment: allowedEnvironment,
      media: [media],
      uploadAsset: vi.fn(),
    }).catch(error => error)

    expect(failure).toBeInstanceOf(Error)
    expect(failure.message).toBe('V2_DEMO_SEED_FAILED')
    expect(JSON.stringify(failure)).not.toContain('secret-db-value')
  })

  it('fails closed instead of accepting partial database writes', async () => {
    const mediaConflict = databaseFixture()

    mediaConflict.database.mediaObject.createMany.mockResolvedValueOnce({
      count: 0,
    })
    await expect(
      executeDemoSeedPlan({
        content: [],
        database: mediaConflict.database,
        environment: allowedEnvironment,
        media: [media],
        uploadAsset: vi.fn(),
      }),
    ).rejects.toThrow('V2_DEMO_MEDIA_WRITE_CONFLICT')

    const contentConflict = databaseFixture()

    contentConflict.transaction.artwork.createMany.mockResolvedValueOnce({
      count: 2,
    })
    await expect(
      executeDemoSeedPlan({
        content: [content],
        database: contentConflict.database,
        environment: allowedEnvironment,
        media: [],
        uploadAsset: vi.fn(),
      }),
    ).rejects.toThrow('V2_DEMO_CONTENT_WRITE_INVALID')

    const placementConflict = databaseFixture()

    placementConflict.transaction.contentMediaPlacement.createMany.mockResolvedValueOnce(
      {
        count: 0,
      },
    )
    await expect(
      executeDemoSeedPlan({
        content: [content],
        database: placementConflict.database,
        environment: allowedEnvironment,
        media: [],
        uploadAsset: vi.fn(),
      }),
    ).rejects.toThrow('V2_DEMO_PLACEMENT_WRITE_CONFLICT')

    const revisionConflict = databaseFixture()

    revisionConflict.transaction.contentRevision.createMany.mockResolvedValueOnce(
      {
        count: 0,
      },
    )
    await expect(
      executeDemoSeedPlan({
        content: [content],
        database: revisionConflict.database,
        environment: allowedEnvironment,
        media: [],
        uploadAsset: vi.fn(),
      }),
    ).rejects.toThrow('V2_DEMO_REVISION_WRITE_CONFLICT')
  })
})
