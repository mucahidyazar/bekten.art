import {unstable_noStore as noStore} from 'next/cache'

import {contentRepository} from '@/server/database/content'

import type {AppLocale} from '@/lib/localized-path'
import type {
  ArtistStat,
  Artwork,
  Memory,
  NewsArticle,
  Testimonial,
  WorkshopItem,
} from '@/server/content/domain'

const HOMEPAGE_LIMITS = Object.freeze({
  artistStats: 10,
  artworks: 6,
  memories: 6,
  testimonials: 10,
  workshopItems: 6,
})

export type HomepageContent = Readonly<{
  artistStats: ArtistStat[]
  artworks: Artwork[]
  memories: Memory[]
  testimonials: Testimonial[]
  workshopItems: WorkshopItem[]
}>

export async function getHomepageContent(
  locale: AppLocale,
): Promise<HomepageContent> {
  noStore()

  const [workshopItems, artistStats, testimonials, memories, artworks] =
    await Promise.all([
      contentRepository.workshopItems.listPublished({
        locale,
        limit: HOMEPAGE_LIMITS.workshopItems,
      }),
      contentRepository.artistStats.listPublished({
        locale,
        limit: HOMEPAGE_LIMITS.artistStats,
      }),
      contentRepository.testimonials.listPublished({
        locale,
        limit: HOMEPAGE_LIMITS.testimonials,
      }),
      contentRepository.memories.listPublished({
        locale,
        limit: HOMEPAGE_LIMITS.memories,
      }),
      contentRepository.artworks.listPublished({
        locale,
        limit: HOMEPAGE_LIMITS.artworks,
      }),
    ])

  return {artistStats, artworks, memories, testimonials, workshopItems}
}

export async function getPublishedNewsArticle(
  locale: AppLocale,
  identifier: string,
): Promise<NewsArticle | null> {
  noStore()

  return contentRepository.newsArticles.findPublishedByIdentifier({
    identifier,
    locale,
  })
}

export async function getPublishedNewsArticles(
  locale: AppLocale,
  limit = 50,
): Promise<NewsArticle[]> {
  noStore()

  return contentRepository.newsArticles.listPublished({locale, limit})
}

export async function getPublishedStoreArtworks(
  locale: AppLocale,
  limit = 50,
): Promise<Artwork[]> {
  noStore()

  return contentRepository.artworks.listPublished({locale, limit})
}
