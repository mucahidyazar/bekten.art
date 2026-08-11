import {describe, expect, it, vi} from 'vitest'

import {
  assertVerifiedInstagramSeedAllowed,
  createVerifiedInstagramSeedPlan,
  executeVerifiedInstagramSeed,
  verifiedInstagramSources,
} from './verified-instagram-content.mjs'

const allowedEnvironment = Object.freeze({
  ALLOW_VERIFIED_INSTAGRAM_SEED: 'true',
  VERIFIED_INSTAGRAM_SEED_CONFIRMATION: 'bekten-art-verified-instagram',
})

function sourceRow(source = verifiedInstagramSources[0]) {
  return Object.freeze({
    caption: source.caption,
    media_object: Object.freeze({
      height: 810,
      id: '50000000-0000-4000-8000-000000000001',
      mimeType: 'image/webp',
      status: 'READY',
      visibility: 'PUBLIC',
      width: 1080,
    }),
    media_object_id: '50000000-0000-4000-8000-000000000001',
    posted_at: new Date('2026-05-14T12:53:34.000Z'),
    shortcode: source.shortcode,
    source_permalink: `https://www.instagram.com/p/${source.shortcode}/`,
    username: 'bekten_usubaliev',
  })
}

describe('verified Instagram editorial seed', () => {
  it('requires an explicit double confirmation', () => {
    expect(() => assertVerifiedInstagramSeedAllowed({})).toThrow(
      'VERIFIED_INSTAGRAM_SEED_NOT_AUTHORIZED',
    )
    expect(() =>
      assertVerifiedInstagramSeedAllowed({
        ALLOW_VERIFIED_INSTAGRAM_SEED: 'true',
      }),
    ).toThrow('VERIFIED_INSTAGRAM_SEED_NOT_AUTHORIZED')
    expect(() =>
      assertVerifiedInstagramSeedAllowed(allowedEnvironment),
    ).not.toThrow()
  })

  it('builds only source-matched, price-free, Garage-backed artwork snapshots', () => {
    const plan = createVerifiedInstagramSeedPlan([sourceRow()], {
      publishedAt: new Date('2026-08-11T00:00:00.000Z'),
    })

    expect(plan.artworks).toHaveLength(1)
    expect(plan.rejected).toHaveLength(0)
    expect(plan.artworks[0]).toMatchObject({
      source: {
        provider: 'instagram',
        shortcode: verifiedInstagramSources[0].shortcode,
      },
      row: {
        locale: 'en',
        status: 'PUBLISHED',
        title: verifiedInstagramSources[0].title,
      },
      revision: {
        entityType: 'ARTWORK',
        operation: 'PUBLISH',
        version: 1,
      },
    })
    expect(plan.artworks[0].revision.snapshot.mediaPlacements).toEqual([
      expect.objectContaining({
        mediaObjectId: '50000000-0000-4000-8000-000000000001',
        role: 'HERO',
      }),
    ])
    expect(
      plan.artworks[0].revision.snapshot.mediaPlacements[0],
    ).not.toHaveProperty('focalPoint')
    expect(JSON.stringify(plan)).not.toMatch(/priceMinor|currency|raw_payload/u)
  })

  it('rejects altered captions, foreign accounts, unsafe links, and ineligible media', () => {
    const valid = sourceRow()
    const invalidRows = [
      {...valid, caption: `${valid.caption} changed`},
      {...valid, username: 'another_account'},
      {...valid, source_permalink: 'https://example.com/post'},
      {
        ...valid,
        media_object: {...valid.media_object, status: 'UPLOADING'},
      },
    ]

    for (const invalid of invalidRows) {
      const plan = createVerifiedInstagramSeedPlan([invalid])

      expect(plan.artworks).toHaveLength(0)
      expect(plan.rejected).toHaveLength(1)
    }
  })

  it('persists new records transactionally and preserves an existing Studio edit', async () => {
    const plan = createVerifiedInstagramSeedPlan([sourceRow()])
    const artwork = plan.artworks[0]
    const collection = plan.collection
    const transaction = {
      artwork: {
        createMany: vi
          .fn()
          .mockResolvedValueOnce({count: 1})
          .mockResolvedValueOnce({count: 0}),
        findUnique: vi.fn().mockResolvedValue({
          id: artwork.entityId,
          version: 4,
        }),
      },
      auditEvent: {create: vi.fn().mockResolvedValue({id: 'audit'})},
      collection: {
        createMany: vi.fn().mockResolvedValue({count: 1}),
        findUnique: vi.fn(),
      },
      contentMediaPlacement: {
        createMany: vi.fn().mockResolvedValue({count: 1}),
      },
      contentRevision: {
        createMany: vi.fn().mockResolvedValue({count: 1}),
      },
      outboxJob: {create: vi.fn().mockResolvedValue({id: 'job'})},
    }
    const database = {
      $transaction: vi.fn(callback => callback(transaction)),
      instagramPost: {findMany: vi.fn().mockResolvedValue([sourceRow()])},
    }

    const first = await executeVerifiedInstagramSeed({
      database,
      environment: allowedEnvironment,
    })
    const second = await executeVerifiedInstagramSeed({
      database,
      environment: allowedEnvironment,
    })

    expect(first).toMatchObject({created: 1, existing: 0, rejected: 0})
    expect(second).toMatchObject({created: 0, existing: 1, rejected: 0})
    expect(transaction.contentRevision.createMany).toHaveBeenCalledWith({
      data: [collection.revision],
      skipDuplicates: true,
    })
    expect(transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'editorial.instagram-source-preserved',
        entityId: artwork.entityId,
        metadata: expect.objectContaining({
          preservedVersion: 4,
          sourceUrl: artwork.source.url,
        }),
      }),
    })
  })
})
