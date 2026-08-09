import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  findPublishedByIdentifier: vi.fn(),
  listPublished: vi.fn(),
}))

vi.mock('next/cache', () => ({unstable_noStore: vi.fn()}))
vi.mock('@/server/database/content', () => ({
  contentRepository: {
    artistStats: {listPublished: mocks.listPublished},
    artworks: {listPublished: mocks.listPublished},
    memories: {listPublished: mocks.listPublished},
    newsArticles: {
      findPublishedByIdentifier: mocks.findPublishedByIdentifier,
      listPublished: mocks.listPublished,
    },
    testimonials: {listPublished: mocks.listPublished},
    workshopItems: {listPublished: mocks.listPublished},
  },
}))

import {
  getHomepageContent,
  getPublishedNewsArticle,
  getPublishedNewsArticles,
  getPublishedStoreArtworks,
} from './sections'

describe('typed public content queries', () => {
  beforeEach(() => {
    mocks.listPublished.mockReset()
    mocks.listPublished.mockResolvedValue([])
    mocks.findPublishedByIdentifier.mockReset()
    mocks.findPublishedByIdentifier.mockResolvedValue(null)
  })

  it('loads every homepage collection from typed repositories in the requested locale', async () => {
    const result = await getHomepageContent('tr')

    expect(result).toEqual({
      artistStats: [],
      artworks: [],
      memories: [],
      testimonials: [],
      workshopItems: [],
    })
    expect(mocks.listPublished).toHaveBeenCalledTimes(5)
    expect(mocks.listPublished).toHaveBeenCalledWith({locale: 'tr', limit: 6})
    expect(mocks.listPublished).toHaveBeenCalledWith({locale: 'tr', limit: 10})
  })

  it('uses bounded typed queries for the store and news index', async () => {
    await getPublishedStoreArtworks('ky', 24)
    await getPublishedNewsArticles('ky', 12)

    expect(mocks.listPublished).toHaveBeenNthCalledWith(1, {
      locale: 'ky',
      limit: 24,
    })
    expect(mocks.listPublished).toHaveBeenNthCalledWith(2, {
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

    await expect(getPublishedNewsArticle('ru', 'published-story')).resolves.toEqual(
      expect.objectContaining({id: 'article-id'}),
    )
    expect(mocks.findPublishedByIdentifier).toHaveBeenCalledWith({
      identifier: 'published-story',
      locale: 'ru',
    })
  })
})
