import {describe, expect, it} from 'vitest'

import {
  editorialPublishingCodecs,
  parseEditorialAggregateSnapshot,
  validateEditorialAggregateSnapshot,
} from './editorial-codecs'
import {editorialEntityCodecs} from './editorial-entity-codecs'

const entityId = '9973ebcd-581d-427f-a23a-9e77fb008f52'
const mediaObjectId = 'c33944f3-b5d8-49ed-a5cb-2e701a91be3c'
const common = {
  createdAt: new Date('2026-08-10T10:00:00.000Z'),
  displayOrder: 0,
  id: entityId,
  locale: 'en',
  publishedAt: null,
  seoCanonicalPath: '/en/works/silent-steppe',
  seoDescription:
    'An archival artwork presented through the Bekten Studio editorial collection.',
  seoNoIndex: false,
  seoTitle: 'Silent Steppe — Bekten Studio',
  slug: 'silent-steppe',
  status: 'DRAFT',
  updatedAt: new Date('2026-08-10T10:00:00.000Z'),
  version: 1,
}
const media = [
  {
    altText: 'A layered abstract composition in ochre and charcoal',
    caption: null,
    credit: 'Bekten Studio archive',
    crop: 'ORIGINAL',
    displayOrder: 0,
    focalPoint: {x: 0.4, y: 0.6},
    mediaObjectId,
    role: 'HERO',
  },
]

describe('editorial Prisma snapshot codecs', () => {
  it('provides a fail-closed codec for each persisted editorial entity', () => {
    expect(
      Object.fromEntries(
        Object.entries(editorialPublishingCodecs).map(([type, codec]) => [
          type,
          codec.delegate,
        ]),
      ),
    ).toEqual({
      ARTWORK: 'artwork',
      COLLECTION: 'collection',
      EXHIBITION: 'exhibition',
      JOURNAL_ENTRY: 'journalEntry',
      PAGE: 'page',
      PRESS_ENTRY: 'pressItem',
    })
  })

  it('serializes price-free artwork drafts with structured media', () => {
    const snapshot = editorialPublishingCodecs.ARTWORK.draftSnapshot(
      {
        ...common,
        availability: 'ON_REQUEST',
        collectionId: null,
        currency: 'EUR',
        description:
          'A sufficiently complete description of the artwork and its material history.',
        dimensions: '120 × 90 cm',
        medium: 'Oil and mineral pigment on canvas',
        priceMinor: 500_000,
        title: 'Silent Steppe',
        year: 2026,
      },
      media,
    )

    expect(snapshot).toMatchObject({
      availability: 'ON_REQUEST',
      mediaPlacements: [expect.objectContaining({role: 'HERO'})],
      seo: {canonicalPath: '/en/works/silent-steppe'},
      title: 'Silent Steppe',
    })
    expect(snapshot).not.toHaveProperty('priceMinor')
    expect(snapshot).not.toHaveProperty('currency')
    expect(validateEditorialAggregateSnapshot({
      entityId,
      entityType: 'ARTWORK',
      locale: 'en',
      slug: 'silent-steppe',
      snapshot,
    })).toEqual(snapshot)
  })

  it('encodes date fields as immutable JSON and restores them for validation', () => {
    const snapshot = editorialPublishingCodecs.EXHIBITION.draftSnapshot(
      {
        ...common,
        body: 'A complete curatorial account of the exhibition and selected works.',
        city: 'Istanbul',
        country: 'Türkiye',
        endsAt: new Date('2026-10-20T17:00:00.000Z'),
        startsAt: new Date('2026-09-10T09:00:00.000Z'),
        subtitle: null,
        title: 'Lines of Memory',
        venue: 'Bekten Studio',
      },
      media,
    )

    expect(snapshot).toMatchObject({
      endsAt: '2026-10-20T17:00:00.000Z',
      startsAt: '2026-09-10T09:00:00.000Z',
    })
    expect(Object.isFrozen(snapshot)).toBe(true)
    expect(
      validateEditorialAggregateSnapshot({
        entityId,
        entityType: 'EXHIBITION',
        locale: 'en',
        slug: 'silent-steppe',
        snapshot,
      }),
    ).toEqual(snapshot)
  })

  it('rejects malformed rows, mismatched identity and inaccessible media', () => {
    expect(() =>
      editorialPublishingCodecs.ARTWORK.draftSnapshot(
        {...common, description: 'short', title: 'Broken'},
        media,
      ),
    ).toThrow()
    expect(() =>
      editorialPublishingCodecs.COLLECTION.draftSnapshot(
        {
          ...common,
          description:
            'A focused collection tracing recurring material and cultural themes.',
          title: 'Material Memory',
        },
        [{...media[0], altText: ''}],
      ),
    ).toThrow()
    expect(() =>
      validateEditorialAggregateSnapshot({
        entityId,
        entityType: 'ARTWORK',
        locale: 'tr',
        slug: 'silent-steppe',
        snapshot: {
          ...editorialPublishingCodecs.ARTWORK.draftSnapshot(
            {
              ...common,
              availability: 'ON_REQUEST',
              collectionId: null,
              description:
                'A sufficiently complete description of the artwork and its material history.',
              title: 'Silent Steppe',
            },
            media,
          ),
        },
      }),
    ).toThrow('EDITORIAL_SNAPSHOT_IDENTITY_MISMATCH')
  })

  it.each([
    {
      expectedData: {description: expect.stringContaining('collection')},
      row: {
        ...common,
        description:
          'A focused collection tracing recurring material and cultural themes.',
        title: 'Material Memory',
      },
      type: 'COLLECTION' as const,
    },
    {
      expectedData: {venue: 'Bekten Studio'},
      row: {
        ...common,
        body: 'A complete curatorial account of the exhibition and selected works.',
        city: 'Istanbul',
        country: 'Türkiye',
        endsAt: new Date('2026-10-20T17:00:00.000Z'),
        startsAt: new Date('2026-09-10T09:00:00.000Z'),
        subtitle: null,
        title: 'Lines of Memory',
        venue: 'Bekten Studio',
      },
      type: 'EXHIBITION' as const,
    },
    {
      expectedData: {excerpt: expect.stringContaining('archive')},
      row: {
        ...common,
        body: 'A complete long-form journal entry about process and material memory.',
        excerpt: 'A concise introduction to process, archive, and material memory.',
        title: 'Inside the Archive',
      },
      type: 'JOURNAL_ENTRY' as const,
    },
    {
      expectedData: {eyebrow: 'Archive'},
      row: {
        ...common,
        body: 'A sufficiently complete editorial page body for publication.',
        eyebrow: 'Archive',
        title: 'The Studio',
      },
      type: 'PAGE' as const,
    },
    {
      expectedData: {category: 'INTERVIEW', outlet: 'Art Review'},
      row: {
        ...common,
        category: 'INTERVIEW',
        content: 'A complete editorial summary of the published conversation.',
        description:
          'A focused conversation about making art across places and generations.',
        outlet: 'Art Review',
        publishedOn: new Date('2026-07-15T00:00:00.000Z'),
        sourceUrl: 'https://example.com/interviews/bekten',
        subtitle: null,
        title: 'A Conversation with Bekten',
      },
      type: 'PRESS_ENTRY' as const,
    },
  ])('round-trips $type rows through edit, record and public projections', item => {
    const codec = editorialEntityCodecs[item.type]
    const snapshot = editorialPublishingCodecs[item.type].draftSnapshot(
      item.row,
      media,
    )
    const edit = parseEditorialAggregateSnapshot({
      entityId,
      entityType: item.type,
      locale: 'en',
      slug: 'silent-steppe',
      snapshot,
    })
    const recordMedia = media.map((placement, index) => ({
      ...placement,
      createdAt: common.createdAt,
      entityId,
      entityType: item.type,
      id:
        index === 0
          ? 'f60a4720-9bc7-46b1-a65d-bd194be2fac0'
          : '827a061c-dbf6-4ae6-afcb-9f3666a5ff69',
      updatedAt: common.updatedAt,
    }))

    expect(codec.data(edit)).toMatchObject(item.expectedData)
    expect(codec.record(item.row, recordMedia)).toMatchObject({
      id: entityId,
      status: 'DRAFT',
    })
    expect(codec.publicFromSnapshot(snapshot, common.createdAt)).toMatchObject({
      publishedAt: common.createdAt,
      slug: 'silent-steppe',
    })
  })

  it('preserves intentional null optional fields across persistence mappings', () => {
    const artworkSnapshot = editorialPublishingCodecs.ARTWORK.draftSnapshot(
      {
        ...common,
        availability: 'ON_REQUEST',
        collectionId: null,
        description:
          'A sufficiently complete description of the artwork and its material history.',
        dimensions: null,
        medium: null,
        title: 'Silent Steppe',
        year: null,
      },
      media,
    )
    const exhibitionSnapshot =
      editorialPublishingCodecs.EXHIBITION.draftSnapshot(
        {
          ...common,
          body: 'A complete curatorial account of the exhibition and selected works.',
          city: null,
          country: null,
          endsAt: null,
          startsAt: new Date('2026-09-10T09:00:00.000Z'),
          subtitle: 'A material history',
          title: 'Lines of Memory',
          venue: null,
        },
        media,
      )
    const pageSnapshot = editorialPublishingCodecs.PAGE.draftSnapshot(
      {
        ...common,
        body: 'A sufficiently complete editorial page body for publication.',
        eyebrow: null,
        title: 'The Studio',
      },
      media,
    )
    const pressSnapshot = editorialPublishingCodecs.PRESS_ENTRY.draftSnapshot(
      {
        ...common,
        category: 'FEATURE',
        content: null,
        description:
          'A focused feature about making art across places and generations.',
        outlet: 'Art Review',
        publishedOn: null,
        sourceUrl: 'https://example.com/features/bekten',
        subtitle: 'Across generations',
        title: 'Material Memory',
      },
      media,
    )

    const parsed = (
      type: 'ARTWORK' | 'EXHIBITION' | 'PAGE' | 'PRESS_ENTRY',
      snapshot: typeof artworkSnapshot,
    ) =>
      parseEditorialAggregateSnapshot({
        entityId,
        entityType: type,
        locale: 'en',
        slug: 'silent-steppe',
        snapshot,
      })

    expect(
      editorialEntityCodecs.ARTWORK.data(
        parsed('ARTWORK', artworkSnapshot),
      ),
    ).toMatchObject({dimensions: null, medium: null, year: null})
    expect(
      editorialEntityCodecs.EXHIBITION.data(
        parsed('EXHIBITION', exhibitionSnapshot),
      ),
    ).toMatchObject({city: null, country: null, endsAt: null, venue: null})
    expect(
      editorialEntityCodecs.PAGE.data(parsed('PAGE', pageSnapshot)),
    ).toMatchObject({eyebrow: null})
    expect(
      editorialEntityCodecs.PRESS_ENTRY.data(
        parsed('PRESS_ENTRY', pressSnapshot),
      ),
    ).toMatchObject({content: null, publishedOn: null})
  })
})
