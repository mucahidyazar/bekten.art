import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const {notFound, reader} = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  reader: {
    getCollection: vi.fn(),
    getExhibition: vi.fn(),
    getJournalEntry: vi.fn(),
    getPressEntry: vi.fn(),
    getWork: vi.fn(),
    listCollections: vi.fn(),
    listExhibitions: vi.fn(),
    listJournalEntries: vi.fn(),
    listPressEntries: vi.fn(),
    listWorks: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({notFound}))
vi.mock('@/server/public-editorial', () => ({publicEditorialReader: reader}))

import AvailableWorksPage, {
  dynamic as availableWorksDynamic,
  generateMetadata as generateAvailableWorksMetadata,
} from '../available-works/page'
import CollectionDetailPage, {
  dynamic as collectionDetailDynamic,
  generateMetadata as generateCollectionDetailMetadata,
} from '../collections/[slug]/page'
import CollectionsPage, {
  dynamic as collectionsDynamic,
  generateMetadata as generateCollectionsMetadata,
} from '../collections/page'
import ExhibitionDetailPage, {
  dynamic as exhibitionDetailDynamic,
  generateMetadata as generateExhibitionDetailMetadata,
} from '../exhibitions/[slug]/page'
import ExhibitionsPage, {
  dynamic as exhibitionsDynamic,
  generateMetadata as generateExhibitionsMetadata,
} from '../exhibitions/page'
import JournalDetailPage, {
  dynamic as journalDetailDynamic,
  generateMetadata as generateJournalDetailMetadata,
} from '../journal/[slug]/page'
import JournalPage, {
  dynamic as journalDynamic,
  generateMetadata as generateJournalMetadata,
} from '../journal/page'
import PressDetailPage, {
  dynamic as pressDetailDynamic,
  generateMetadata as generatePressDetailMetadata,
} from '../press/[slug]/page'
import PressPage, {
  dynamic as pressDynamic,
  generateMetadata as generatePressMetadata,
} from '../press/page'

import WorkDetailPage, {
  dynamic as workDetailDynamic,
  generateMetadata as generateWorkDetailMetadata,
} from './[slug]/page'
import WorksPage, {
  dynamic as worksDynamic,
  generateMetadata as generateWorksMetadata,
} from './page'

import type {
  PublicArtwork,
  PublicCollection,
  PublicExhibition,
  PublicJournalEntry,
  PublicPressEntry,
} from '@/server/public-editorial'

const media = {
  altText: 'Ochre figures moving across a blue steppe',
  caption: null,
  credit: 'Bekten Studio',
  crop: 'ORIGINAL',
  displayOrder: 0,
  focalPoint: {x: 0.5, y: 0.5},
  height: 1200,
  mediaObjectId: '50000000-0000-4000-8000-000000000001',
  mimeType: 'image/png',
  role: 'HERO',
  url: '/api/media/50000000-0000-4000-8000-000000000001',
  width: 960,
} as const

const work = {
  availability: 'AVAILABLE',
  collectionId: '20000000-0000-4000-8000-000000000001',
  description:
    'A quiet study of memory, migration and the open Central Asian steppe.',
  dimensions: '100 × 80 cm',
  displayOrder: 0,
  id: '10000000-0000-4000-8000-000000000001',
  locale: 'en',
  medium: 'Oil on canvas',
  mediaPlacements: [media],
  publishedAt: '2026-08-11T00:00:00.000Z',
  seo: {
    canonicalPath: '/en/works/silent-steppe',
    description:
      'Silent Steppe is a quiet study of memory and migration by Bekten Usubaliev.',
    noIndex: true,
    title: 'Silent Steppe',
  },
  slug: 'silent-steppe',
  title: 'Silent Steppe',
  year: 2026,
} as unknown as PublicArtwork

const archivedWork = {
  ...work,
  availability: 'ON_REQUEST',
  id: '10000000-0000-4000-8000-000000000002',
  slug: 'archival-memory',
  title: 'Archival Memory',
} as PublicArtwork

const collection = {
  description:
    'A collection tracing remembered landscapes through intimate studies.',
  displayOrder: 0,
  id: '20000000-0000-4000-8000-000000000001',
  locale: 'en',
  mediaPlacements: [media],
  publishedAt: '2026-08-11T00:00:00.000Z',
  seo: {
    canonicalPath: '/en/collections/remembered-landscapes',
    description:
      'Remembered Landscapes traces place and memory in paintings by Bekten Usubaliev.',
    noIndex: false,
    title: 'Remembered Landscapes',
  },
  slug: 'remembered-landscapes',
  title: 'Remembered Landscapes',
} as unknown as PublicCollection

const exhibition = {
  body: 'The exhibition follows memory across the steppe.\n\nEach work holds a distinct fragment of place.',
  city: 'Bishkek',
  country: 'Kyrgyzstan',
  displayOrder: 0,
  endsAt: '2026-10-10T00:00:00.000Z',
  id: '30000000-0000-4000-8000-000000000001',
  locale: 'en',
  mediaPlacements: [media],
  publishedAt: '2026-08-11T00:00:00.000Z',
  seo: {
    canonicalPath: '/en/exhibitions/echoes-of-the-steppe',
    description:
      'Echoes of the Steppe presents paintings shaped by landscape and memory.',
    noIndex: false,
    title: 'Echoes of the Steppe',
  },
  slug: 'echoes-of-the-steppe',
  startsAt: '2026-09-01T00:00:00.000Z',
  subtitle: 'Memory, landscape and return',
  title: 'Echoes of the Steppe',
  venue: 'Bekten Studio',
} as unknown as PublicExhibition

const journalEntry = {
  body: "<script>alert('unsafe')</script>\n\nThe studio archive begins with close looking.",
  displayOrder: 0,
  excerpt: 'Notes from the studio on painting, memory and the living archive.',
  id: '40000000-0000-4000-8000-000000000001',
  locale: 'en',
  mediaPlacements: [media],
  publishedAt: '2026-08-11T00:00:00.000Z',
  seo: {
    canonicalPath: '/en/journal/the-living-archive',
    description:
      'Studio notes on the living archive and the practice of close looking.',
    noIndex: false,
    title: 'The Living Archive',
  },
  slug: 'the-living-archive',
  title: 'The Living Archive',
} as unknown as PublicJournalEntry

const pressEntry = {
  body: '<img src=x onerror=alert(1)>\n\nA conversation about painting across generations.',
  displayOrder: 0,
  excerpt: 'A conversation about painting, memory and the Kyrgyz landscape.',
  id: '60000000-0000-4000-8000-000000000001',
  locale: 'en',
  mediaPlacements: [media],
  outlet: 'Art Review',
  pressCategory: 'INTERVIEW',
  publishedAt: '2026-08-11T00:00:00.000Z',
  publishedOn: '2026-08-01T00:00:00.000Z',
  seo: {
    canonicalPath: '/en/press/a-conversation-across-generations',
    description:
      'Art Review speaks with Bekten Usubaliev about painting across generations.',
    noIndex: false,
    title: 'A Conversation Across Generations',
  },
  slug: 'a-conversation-across-generations',
  sourceUrl: 'https://example.com/interview',
  subtitle: 'Bekten Usubaliev in Art Review',
  title: 'A Conversation Across Generations',
} as unknown as PublicPressEntry

const params = (locale = 'en') => Promise.resolve({locale})
const detailParams = (slug: string, locale = 'en') =>
  Promise.resolve({locale, slug})

beforeEach(() => {
  vi.clearAllMocks()
  reader.getCollection.mockResolvedValue({collection, works: [work]})
  reader.getExhibition.mockResolvedValue({exhibition, works: [work]})
  reader.getJournalEntry.mockResolvedValue(journalEntry)
  reader.getPressEntry.mockResolvedValue(pressEntry)
  reader.getWork.mockResolvedValue(work)
  reader.listCollections.mockResolvedValue([collection])
  reader.listExhibitions.mockResolvedValue([exhibition])
  reader.listJournalEntries.mockResolvedValue([journalEntry])
  reader.listPressEntries.mockResolvedValue([pressEntry])
  reader.listWorks.mockResolvedValue([work, archivedWork])
})

describe('V2 public editorial list routes', () => {
  it.each(['en', 'tr', 'ru', 'ky']) (
    'accepts the supported %s locale and reads only the public work projection',
    async locale => {
      render(await WorksPage({params: params(locale)}))

      expect(reader.listWorks).toHaveBeenCalledWith(locale)
      expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1)
    },
  )

  it('rejects unsupported locales before querying editorial content', async () => {
    await expect(
      WorksPage({params: params('de')}),
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(reader.listWorks).not.toHaveBeenCalled()
  })

  it('renders the full works archive without commerce language', async () => {
    render(await WorksPage({params: params()}))

    expect(screen.getByRole('heading', {level: 1, name: 'Works'})).toBeVisible()
    expect(screen.getByRole('link', {name: /silent steppe/iu})).toHaveAttribute(
      'href',
      '/en/works/silent-steppe',
    )
    expect(screen.queryByText(/add to cart|checkout|price/iu)).toBeNull()
  })

  it('limits the available archive to works explicitly marked AVAILABLE', async () => {
    render(await AvailableWorksPage({params: params()}))

    expect(
      screen.getByRole('heading', {level: 1, name: 'Available works'}),
    ).toBeVisible()
    expect(screen.getByText('Silent Steppe')).toBeVisible()
    expect(screen.queryByText('Archival Memory')).toBeNull()
  })

  it.each([
    ['Collections', CollectionsPage, '/en/collections/remembered-landscapes'],
    ['Exhibitions', ExhibitionsPage, '/en/exhibitions/echoes-of-the-steppe'],
    ['Journal', JournalPage, '/en/journal/the-living-archive'],
    ['Press', PressPage, '/en/press/a-conversation-across-generations'],
  ] as const)(
    'renders the %s editorial list as linked semantic articles',
    async (heading, Page, href) => {
      render(await Page({params: params()}))

      expect(screen.getByRole('heading', {level: 1, name: heading})).toBeVisible()
      expect(screen.getAllByRole('article')).toHaveLength(1)
      expect(screen.getByRole('link', {name: /./u})).toHaveAttribute('href', href)
    },
  )

  it('emits locale-specific canonical metadata for every list route', async () => {
    const metadata = await Promise.all([
      generateWorksMetadata({params: params('tr')}),
      generateAvailableWorksMetadata({params: params('tr')}),
      generateCollectionsMetadata({params: params('tr')}),
      generateExhibitionsMetadata({params: params('tr')}),
      generateJournalMetadata({params: params('tr')}),
      generatePressMetadata({params: params('tr')}),
    ])

    expect(metadata.map(item => item.alternates?.canonical)).toEqual([
      '/tr/works',
      '/tr/available-works',
      '/tr/collections',
      '/tr/exhibitions',
      '/tr/journal',
      '/tr/press',
    ])
  })
})

describe('V2 public editorial detail routes', () => {
  it('renders a work with an artwork-bound availability inquiry and no store UI', async () => {
    render(await WorkDetailPage({params: detailParams(work.slug)}))

    expect(
      screen.getByRole('heading', {level: 1, name: 'Silent Steppe'}),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', {name: 'Availability inquiry'}),
    ).toBeVisible()
    expect(screen.getByText('Oil on canvas')).toBeVisible()
    expect(screen.queryByText(/add to cart|checkout|price/iu)).toBeNull()
  })

  it('renders collection and exhibition details with their associated works', async () => {
    render(
      await CollectionDetailPage({
        params: detailParams(collection.slug),
      }),
    )

    expect(
      screen.getByRole('heading', {level: 1, name: collection.title}),
    ).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Works in this collection'})).toBeVisible()
    expect(screen.getByRole('link', {name: /silent steppe/iu})).toBeVisible()

    document.body.innerHTML = ''
    render(
      await ExhibitionDetailPage({
        params: detailParams(exhibition.slug),
      }),
    )

    expect(
      screen.getByRole('heading', {level: 1, name: exhibition.title}),
    ).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Exhibited works'})).toBeVisible()
    expect(screen.getByRole('link', {name: /silent steppe/iu})).toBeVisible()
  })

  it('renders journal and press bodies as escaped plain text', async () => {
    const journalView = render(
      await JournalDetailPage({params: detailParams(journalEntry.slug)}),
    )

    expect(journalView.container.querySelector('script')).toBeNull()
    expect(screen.getByText("<script>alert('unsafe')</script>")).toBeVisible()

    journalView.unmount()
    const pressView = render(
      await PressDetailPage({params: detailParams(pressEntry.slug)}),
    )

    expect(pressView.container.querySelector('img[src="x"]')).toBeNull()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeVisible()
    expect(screen.getByRole('link', {name: 'Read at source'})).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    )
  })

  it.each([
    ['work', 'getWork', WorkDetailPage, work.slug],
    ['collection', 'getCollection', CollectionDetailPage, collection.slug],
    ['exhibition', 'getExhibition', ExhibitionDetailPage, exhibition.slug],
    ['journal', 'getJournalEntry', JournalDetailPage, journalEntry.slug],
    ['press', 'getPressEntry', PressDetailPage, pressEntry.slug],
  ] as const)('returns not found for a missing %s', async (_label, method, Page, slug) => {
    reader[method].mockResolvedValueOnce(null)

    await expect(Page({params: detailParams(slug)})).rejects.toThrow(
      'NEXT_NOT_FOUND',
    )
  })

  it('rejects a non-kebab detail slug before reading content', async () => {
    await expect(
      WorkDetailPage({params: detailParams('../Draft Work')}),
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(reader.getWork).not.toHaveBeenCalled()
  })

  it.each([
    ['work', generateWorkDetailMetadata, work.slug, work.seo],
    [
      'collection',
      generateCollectionDetailMetadata,
      collection.slug,
      collection.seo,
    ],
    [
      'exhibition',
      generateExhibitionDetailMetadata,
      exhibition.slug,
      exhibition.seo,
    ],
    ['journal', generateJournalDetailMetadata, journalEntry.slug, journalEntry.seo],
    ['press', generatePressDetailMetadata, pressEntry.slug, pressEntry.seo],
  ] as const)(
    'uses the %s SEO record for title, canonical and noIndex metadata',
    async (_label, generateMetadata, slug, seo) => {
      const metadata = await generateMetadata({params: detailParams(slug)})

      expect(metadata).toMatchObject({
        alternates: {canonical: seo.canonicalPath},
        description: seo.description,
        robots: {index: !seo.noIndex},
        title: seo.title,
      })
    },
  )

  it('keeps every public editorial route request-time dynamic', () => {
    expect([
      worksDynamic,
      workDetailDynamic,
      availableWorksDynamic,
      collectionsDynamic,
      collectionDetailDynamic,
      exhibitionsDynamic,
      exhibitionDetailDynamic,
      journalDynamic,
      journalDetailDynamic,
      pressDynamic,
      pressDetailDynamic,
    ]).toEqual(Array.from({length: 11}, () => 'force-dynamic'))
  })
})
