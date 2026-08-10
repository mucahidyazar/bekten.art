import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  artistStatsListPublished: vi.fn(),
  findPublishedByIdentifier: vi.fn(),
  memoriesListPublished: vi.fn(),
  newsArticlesListPublished: vi.fn(),
  testimonialsListPublished: vi.fn(),
  workshopItemsListPublished: vi.fn(),
}))

vi.mock('next/cache', () => ({unstable_noStore: vi.fn()}))
vi.mock('@/server/database/content', () => ({
  contentRepository: {
    artistStats: {listPublished: mocks.artistStatsListPublished},
    memories: {listPublished: mocks.memoriesListPublished},
    newsArticles: {
      findPublishedByIdentifier: mocks.findPublishedByIdentifier,
      listPublished: mocks.newsArticlesListPublished,
    },
    testimonials: {listPublished: mocks.testimonialsListPublished},
    workshopItems: {listPublished: mocks.workshopItemsListPublished},
  },
}))

import {
  getHomepageContent,
  getPublishedNewsArticle,
  getPublishedNewsArticles,
} from './sections'

describe('typed public content queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.artistStatsListPublished.mockResolvedValue([])
    mocks.findPublishedByIdentifier.mockResolvedValue(null)
    mocks.memoriesListPublished.mockResolvedValue([])
    mocks.newsArticlesListPublished.mockResolvedValue([])
    mocks.testimonialsListPublished.mockResolvedValue([])
    mocks.workshopItemsListPublished.mockResolvedValue([])
  })

  it('loads every homepage collection from typed repositories in the requested locale', async () => {
    const result = await getHomepageContent('tr')

    expect(result).toEqual({
      artistStats: [],
      memories: [],
      testimonials: [],
      workshopItems: [],
    })
    expect(mocks.artistStatsListPublished).toHaveBeenCalledWith({
      locale: 'tr',
      limit: 10,
    })
    expect(mocks.memoriesListPublished).toHaveBeenCalledWith({
      locale: 'tr',
      limit: 6,
    })
    expect(mocks.testimonialsListPublished).toHaveBeenCalledWith({
      locale: 'tr',
      limit: 10,
    })
    expect(mocks.workshopItemsListPublished).toHaveBeenCalledWith({
      locale: 'tr',
      limit: 6,
    })
  })

  it('uses a bounded typed query for the news index', async () => {
    await getPublishedNewsArticles('ky', 12)

    expect(mocks.newsArticlesListPublished).toHaveBeenCalledWith({
      locale: 'ky',
      limit: 12,
    })
  })

  it('resolves a detail only from the locale-scoped published result', async () => {
    mocks.findPublishedByIdentifier.mockResolvedValue({
      id: 'article-id',
      locale: 'ru',
      slug: 'published-story',
    })

    await expect(
      getPublishedNewsArticle('ru', 'published-story'),
    ).resolves.toEqual(expect.objectContaining({id: 'article-id'}))
    expect(mocks.findPublishedByIdentifier).toHaveBeenCalledWith({
      identifier: 'published-story',
      locale: 'ru',
    })
  })
})
