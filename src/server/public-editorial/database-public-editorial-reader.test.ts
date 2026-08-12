import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createDatabasePublicEditorialReader} from './database-public-editorial-reader'

import type {PublicEditorialDatabase} from './database-public-editorial-reader'

const IDS = {
  artworkA: '10000000-0000-4000-8000-000000000001',
  artworkB: '10000000-0000-4000-8000-000000000002',
  artworkEnglishOnly: '10000000-0000-4000-8000-000000000003',
  artworkTr: '10000000-0000-4000-8000-000000000004',
  collection: '20000000-0000-4000-8000-000000000001',
  exhibition: '30000000-0000-4000-8000-000000000001',
  journal: '40000000-0000-4000-8000-000000000001',
  mediaHero: '50000000-0000-4000-8000-000000000001',
  mediaPrivate: '50000000-0000-4000-8000-000000000002',
  page: '60000000-0000-4000-8000-000000000001',
  press: '70000000-0000-4000-8000-000000000001',
} as const

const publishedAt = new Date('2026-08-10T12:00:00.000Z')
const seo = {
  canonicalPath: '/en/works/sample-work',
  description:
    'A complete editorial description written for public search presentation.',
  noIndex: false,
  title: 'Sample editorial title',
}

function placement(
  mediaObjectId: string = IDS.mediaHero,
  role: 'HERO' | 'GALLERY' = 'HERO',
  displayOrder = 0,
) {
  return {
    altText: 'A detailed view of the artwork',
    caption: null,
    credit: 'Bekten Studio',
    crop: 'ORIGINAL',
    displayOrder,
    focalPoint: {x: 0.5, y: 0.5},
    mediaObjectId,
    role,
  }
}

function artworkSnapshot(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    availability: 'ON_REQUEST',
    collectionId: null,
    description:
      'An original artwork presented through the Bekten Studio archive.',
    dimensions: '100 × 80 cm',
    displayOrder: 0,
    locale: 'en',
    medium: 'Oil on canvas',
    mediaPlacements: [placement()],
    seo,
    slug: 'sample-work',
    title: 'Sample Work',
    year: 2026,
    ...overrides,
  }
}

function snapshotFor(entityType: string) {
  const shared = {
    displayOrder: 0,
    locale: 'en',
    mediaPlacements: [],
    seo,
    slug: 'sample-entry',
  }

  switch (entityType) {
    case 'COLLECTION':
      return {
        ...shared,
        description:
          'A carefully assembled body of works from the Bekten Studio archive.',
        slug: 'sample-collection',
        title: 'Sample Collection',
      }
    case 'EXHIBITION':
      return {
        ...shared,
        body: 'A complete curatorial account of this exhibition and its historical context.',
        city: 'Istanbul',
        country: 'Türkiye',
        endsAt: '2026-09-10T12:00:00.000Z',
        slug: 'sample-exhibition',
        startsAt: '2026-08-10T12:00:00.000Z',
        subtitle: 'A studio presentation',
        title: 'Sample Exhibition',
        venue: 'Bekten Studio',
      }
    case 'JOURNAL_ENTRY':
      return {
        ...shared,
        body: 'A complete journal essay about the artist, process, archive, and ongoing practice.',
        excerpt:
          'A concise introduction to the artist, process, archive, and practice.',
        slug: 'sample-journal',
        title: 'Sample Journal',
      }
    case 'PAGE':
      return {
        ...shared,
        body: 'A complete studio page introducing Bekten, the archive, and the artistic practice.',
        eyebrow: 'Studio',
        slug: 'about',
        title: 'About Bekten',
      }
    case 'PRESS_ENTRY':
      return {
        ...shared,
        body: 'A complete press record retained for the artist archive and its readers.',
        excerpt:
          'A concise press summary retained for the artist archive and its readers.',
        outlet: 'Art Review',
        pressCategory: 'FEATURE',
        publishedOn: '2026-08-01T00:00:00.000Z',
        slug: 'sample-press',
        sourceUrl: 'https://example.com/features/bekten',
        subtitle: 'Inside the studio',
        title: 'Sample Press',
      }
    default:
      return artworkSnapshot()
  }
}

function row(id: string, overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    displayOrder: 0,
    id,
    locale: 'en',
    publishedAt,
    slug: 'draft-row-slug',
    status: 'PUBLISHED',
    translationGroupId: id,
    version: 3,
    ...overrides,
  }
}

function revision(
  entityType: string,
  entityId: string,
  snapshot: unknown,
  version = 2,
  locale = 'en',
) {
  return {
    entityId,
    entityType,
    locale,
    snapshot,
    version,
  }
}

function publicMedia(
  id: string = IDS.mediaHero,
  overrides: Readonly<Record<string, unknown>> = {},
) {
  return {
    height: 1200,
    id,
    mimeType: 'image/webp',
    provider: 'garage',
    status: 'READY',
    visibility: 'PUBLIC',
    width: 1600,
    ...overrides,
  }
}

function fixture(
  input: {
    artworks?: readonly unknown[]
    collections?: readonly unknown[]
    exhibitionArtworks?: readonly unknown[]
    exhibitions?: readonly unknown[]
    journalEntries?: readonly unknown[]
    media?: readonly unknown[]
    pages?: readonly unknown[]
    pressItems?: readonly unknown[]
    revisions?: readonly unknown[]
  } = {},
) {
  const transaction = {
    artwork: {findMany: vi.fn(async () => input.artworks ?? [])},
    collection: {findMany: vi.fn(async () => input.collections ?? [])},
    contentRevision: {
      findMany: vi.fn(async () => input.revisions ?? []),
    },
    exhibition: {findMany: vi.fn(async () => input.exhibitions ?? [])},
    exhibitionArtwork: {
      findMany: vi.fn(async () => input.exhibitionArtworks ?? []),
    },
    journalEntry: {
      findMany: vi.fn(async () => input.journalEntries ?? []),
    },
    mediaObject: {findMany: vi.fn(async () => input.media ?? [])},
    page: {findMany: vi.fn(async () => input.pages ?? [])},
    pressItem: {findMany: vi.fn(async () => input.pressItems ?? [])},
  }
  const database = {
    $transaction: vi.fn(async callback => callback(transaction)),
  } as unknown as PublicEditorialDatabase

  return {
    database,
    reader: createDatabasePublicEditorialReader(database),
    transaction,
  }
}

describe('database public editorial reader', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads only published snapshots, orders deterministically, and exposes no price data', async () => {
    const firstSnapshot = artworkSnapshot({
      displayOrder: 2,
      mediaPlacements: [
        placement(IDS.mediaHero),
        placement(IDS.mediaPrivate, 'GALLERY', 1),
      ],
      slug: 'second-work',
      title: 'Second Work',
    })
    const secondSnapshot = artworkSnapshot({displayOrder: 1})
    const {reader, transaction} = fixture({
      artworks: [
        row(IDS.artworkA, {priceMinor: 999_00, status: 'PUBLISHED'}),
        row(IDS.artworkB, {displayOrder: 99, status: 'PUBLISHED'}),
        row('10000000-0000-4000-8000-000000000003', {status: 'DRAFT'}),
      ],
      media: [
        publicMedia(),
        publicMedia(IDS.mediaPrivate, {visibility: 'PRIVATE'}),
      ],
      revisions: [
        revision('ARTWORK', IDS.artworkA, firstSnapshot, 2),
        revision('ARTWORK', IDS.artworkA, {...firstSnapshot, title: 'Old'}, 1),
        revision('ARTWORK', IDS.artworkB, secondSnapshot, 2),
      ],
    })

    const result = await reader.listWorks('en')

    expect(transaction.artwork.findMany).toHaveBeenCalledWith({
      orderBy: [{displayOrder: 'asc'}, {id: 'asc'}],
      where: {
        locale: {in: ['en', 'tr', 'ru', 'ky']},
        publishedAt: {not: null},
        status: 'PUBLISHED',
      },
    })
    expect(result.map(item => item.title)).toEqual([
      'Sample Work',
      'Second Work',
    ])
    expect(result[1]?.mediaPlacements).toEqual([
      expect.objectContaining({
        mediaObjectId: IDS.mediaHero,
        url: `/api/media/${IDS.mediaHero}`,
      }),
    ])
    expect(result[1]).not.toHaveProperty('priceMinor')
    expect(result[1]).not.toHaveProperty('currency')
    expect(result[0]?.publishedAt).toBe('2026-08-10T12:00:00.000Z')
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result[0])).toBe(true)
    expect(Object.isFrozen(result[0]?.mediaPlacements)).toBe(true)
  })

  it('fails closed for malformed, mismatched, missing, or media-ineligible snapshots', async () => {
    const invalidSnapshot = artworkSnapshot({slug: 'Not-Kebab'})
    const {reader} = fixture({
      artworks: [
        row(IDS.artworkA),
        row(IDS.artworkB),
        row('10000000-0000-4000-8000-000000000003'),
      ],
      media: [publicMedia(IDS.mediaHero, {provider: 's3'})],
      revisions: [
        revision('ARTWORK', IDS.artworkA, invalidSnapshot),
        revision('ARTWORK', IDS.artworkB, artworkSnapshot(), 99),
      ],
    })

    await expect(reader.listWorks('en')).resolves.toEqual([])
  })

  it('resolves details by the published snapshot slug instead of the editable row slug', async () => {
    const {reader, transaction} = fixture({
      artworks: [row(IDS.artworkA, {slug: 'unpublished-draft-slug'})],
      media: [publicMedia()],
      revisions: [revision('ARTWORK', IDS.artworkA, artworkSnapshot())],
    })

    await expect(reader.getWork('en', 'sample-work')).resolves.toEqual(
      expect.objectContaining({slug: 'sample-work', title: 'Sample Work'}),
    )
    await expect(
      reader.getWork('en', 'unpublished-draft-slug'),
    ).resolves.toBeNull()
    expect(transaction.contentRevision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entityType: 'ARTWORK',
          locale: 'en',
          snapshot: {equals: 'sample-work', path: ['slug']},
        }),
      }),
    )
    expect(transaction.artwork.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({id: {in: [IDS.artworkA]}}),
      }),
    )
  })

  it('fills locale gaps from English without duplicating translated identities', async () => {
    const translatedGroup = '90000000-0000-4000-8000-000000000001'
    const englishOnlyGroup = '90000000-0000-4000-8000-000000000002'
    const {reader} = fixture({
      artworks: [
        row(IDS.artworkA, {translationGroupId: translatedGroup}),
        row(IDS.artworkTr, {
          locale: 'tr',
          translationGroupId: translatedGroup,
        }),
        row(IDS.artworkEnglishOnly, {
          translationGroupId: englishOnlyGroup,
        }),
      ],
      media: [publicMedia()],
      revisions: [
        revision(
          'ARTWORK',
          IDS.artworkA,
          artworkSnapshot({slug: 'remembered-land', title: 'Remembered Land'}),
        ),
        revision(
          'ARTWORK',
          IDS.artworkTr,
          artworkSnapshot({
            locale: 'tr',
            seo: {...seo, canonicalPath: '/tr/works/hatirlanan-toprak'},
            slug: 'hatirlanan-toprak',
            title: 'Hatırlanan Toprak',
          }),
          2,
          'tr',
        ),
        revision(
          'ARTWORK',
          IDS.artworkEnglishOnly,
          artworkSnapshot({slug: 'studio-light', title: 'Studio Light'}),
        ),
      ],
    })

    const result = await reader.listWorks('tr')

    expect(result.map(item => [item.locale, item.title])).toEqual([
      ['tr', 'Hatırlanan Toprak'],
      ['en', 'Studio Light'],
    ])
    await expect(reader.getWork('tr', 'studio-light')).resolves.toEqual(
      expect.objectContaining({locale: 'en', title: 'Studio Light'}),
    )
    await expect(reader.listAvailableWorks('tr')).resolves.toEqual([])
  })

  it('applies the same requested-English-other fallback order to available works', async () => {
    const translatedGroup = '90000000-0000-4000-8000-000000000003'
    const {reader} = fixture({
      artworks: [
        row(IDS.artworkA, {translationGroupId: translatedGroup}),
        row(IDS.artworkTr, {
          locale: 'tr',
          translationGroupId: translatedGroup,
        }),
        row(IDS.artworkEnglishOnly, {
          translationGroupId: '90000000-0000-4000-8000-000000000004',
        }),
      ],
      media: [publicMedia()],
      revisions: [
        revision(
          'ARTWORK',
          IDS.artworkA,
          artworkSnapshot({availability: 'AVAILABLE'}),
        ),
        revision(
          'ARTWORK',
          IDS.artworkTr,
          artworkSnapshot({availability: 'ON_REQUEST', locale: 'tr'}),
          2,
          'tr',
        ),
        revision(
          'ARTWORK',
          IDS.artworkEnglishOnly,
          artworkSnapshot({availability: 'AVAILABLE', slug: 'english-only'}),
        ),
      ],
    })

    await expect(reader.listAvailableWorks('tr')).resolves.toEqual([
      expect.objectContaining({locale: 'en', slug: 'english-only'}),
    ])
  })

  it('filters availability after locale fallback selection', async () => {
    const {reader} = fixture({
      artworks: [row(IDS.artworkA), row(IDS.artworkB)],
      media: [publicMedia()],
      revisions: [
        revision(
          'ARTWORK',
          IDS.artworkA,
          artworkSnapshot({availability: 'AVAILABLE'}),
        ),
        revision(
          'ARTWORK',
          IDS.artworkB,
          artworkSnapshot({availability: 'ON_REQUEST'}),
        ),
      ],
    })

    await expect(reader.listAvailableWorks('en')).resolves.toEqual([
      expect.objectContaining({availability: 'AVAILABLE'}),
    ])
  })

  it('rejects invalid locale and slug boundaries before database access', async () => {
    const {database, reader} = fixture()

    await expect(reader.listWorks('de' as 'en')).rejects.toThrow()
    await expect(reader.getWork('en', '../draft')).rejects.toThrow()
    expect(database.$transaction).not.toHaveBeenCalled()
  })

  it('builds collection details with only published works assigned by snapshot', async () => {
    const assigned = artworkSnapshot({collectionId: IDS.collection})
    const {reader, transaction} = fixture({
      artworks: [row(IDS.artworkA), row(IDS.artworkB)],
      collections: [row(IDS.collection)],
      media: [publicMedia()],
      revisions: [
        revision('COLLECTION', IDS.collection, snapshotFor('COLLECTION')),
        revision('ARTWORK', IDS.artworkA, assigned),
        revision('ARTWORK', IDS.artworkB, artworkSnapshot()),
      ],
    })

    const result = await reader.getCollection('en', 'sample-collection')

    expect(result?.collection.title).toBe('Sample Collection')
    expect(result?.works.map(work => work.title)).toEqual(['Sample Work'])
    expect(Object.isFrozen(result)).toBe(true)
    expect(transaction.contentRevision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entityType: 'ARTWORK',
          snapshot: {equals: IDS.collection, path: ['collectionId']},
        }),
      }),
    )
  })

  it('builds exhibition details from deterministic join ordering and published works', async () => {
    const {reader, transaction} = fixture({
      artworks: [row(IDS.artworkA), row(IDS.artworkB, {status: 'ARCHIVED'})],
      exhibitionArtworks: [
        {artworkId: IDS.artworkB, displayOrder: 0},
        {artworkId: IDS.artworkA, displayOrder: 1},
      ],
      exhibitions: [row(IDS.exhibition)],
      media: [publicMedia()],
      revisions: [
        revision('EXHIBITION', IDS.exhibition, snapshotFor('EXHIBITION')),
        revision('ARTWORK', IDS.artworkA, artworkSnapshot()),
      ],
    })

    const result = await reader.getExhibition('en', 'sample-exhibition')

    expect(transaction.exhibitionArtwork.findMany).toHaveBeenCalledWith({
      orderBy: [{displayOrder: 'asc'}, {artworkId: 'asc'}],
      where: {exhibitionId: IDS.exhibition},
    })
    expect(result?.works.map(work => work.title)).toEqual(['Sample Work'])
    expect(result?.exhibition.startsAt).toBe('2026-08-10T12:00:00.000Z')
  })

  it('provides locale-aware collection, exhibition, journal, press, and page reads', async () => {
    const {reader} = fixture({
      collections: [row(IDS.collection)],
      exhibitions: [row(IDS.exhibition)],
      journalEntries: [row(IDS.journal)],
      pages: [row(IDS.page)],
      pressItems: [row(IDS.press)],
      revisions: [
        revision('COLLECTION', IDS.collection, snapshotFor('COLLECTION')),
        revision('EXHIBITION', IDS.exhibition, snapshotFor('EXHIBITION')),
        revision('JOURNAL_ENTRY', IDS.journal, snapshotFor('JOURNAL_ENTRY')),
        revision('PAGE', IDS.page, snapshotFor('PAGE')),
        revision('PRESS_ENTRY', IDS.press, snapshotFor('PRESS_ENTRY')),
      ],
    })

    await expect(reader.listCollections('en')).resolves.toHaveLength(1)
    await expect(reader.listExhibitions('en')).resolves.toHaveLength(1)
    await expect(reader.listJournalEntries('en')).resolves.toHaveLength(1)
    await expect(
      reader.getJournalEntry('en', 'sample-journal'),
    ).resolves.toEqual(expect.objectContaining({title: 'Sample Journal'}))
    await expect(reader.listPressEntries('en')).resolves.toHaveLength(1)
    await expect(reader.getPressEntry('en', 'sample-press')).resolves.toEqual(
      expect.objectContaining({publishedOn: '2026-08-01T00:00:00.000Z'}),
    )
    await expect(reader.getPage('en', 'about')).resolves.toEqual(
      expect.objectContaining({title: 'About Bekten'}),
    )
  })

  it('composes an immutable homepage with deterministic editorial limits', async () => {
    const artworkRows = Array.from({length: 8}, (_, index) =>
      row(`10000000-0000-4000-8000-${String(index + 10).padStart(12, '0')}`),
    )
    const revisions = artworkRows.map((item, index) =>
      revision(
        'ARTWORK',
        item.id,
        artworkSnapshot({
          displayOrder: index,
          slug: `sample-work-${index}`,
          title: `Sample Work ${index}`,
        }),
      ),
    )
    const {reader} = fixture({
      artworks: artworkRows,
      media: [publicMedia()],
      revisions,
    })

    const result = await reader.getHomepage('en')

    expect(result.hero?.title).toBe('Sample Work 0')
    expect(result.works).toHaveLength(6)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('redacts database failure details behind a stable read error', async () => {
    const {database, reader} = fixture()

    vi.mocked(database.$transaction).mockRejectedValueOnce(
      new Error('postgres://secret@internal-host'),
    )

    await expect(reader.listWorks('en')).rejects.toThrow(
      'PUBLIC_EDITORIAL_READ_FAILED',
    )
  })
})
