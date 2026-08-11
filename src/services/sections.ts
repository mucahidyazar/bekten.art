import {unstable_noStore as noStore} from 'next/cache'

import {contentRepository} from '@/server/database/content'

import type {BuiltInAppLocale} from '@/lib/localized-path'
import type {
  ArtistStat,
  Memory,
  NewsArticle,
  Testimonial,
  WorkshopItem,
} from '@/server/content/domain'

const HOMEPAGE_LIMITS = Object.freeze({
  artistStats: 10,
  memories: 6,
  testimonials: 10,
  workshopItems: 6,
})

export type HomepageContent = Readonly<{
  artistStats: ArtistStat[]
  memories: Memory[]
  testimonials: Testimonial[]
  workshopItems: WorkshopItem[]
}>

export async function getHomepageContent(
  locale: BuiltInAppLocale,
): Promise<HomepageContent> {
  noStore()

  const [workshopItems, artistStats, testimonials, memories] =
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
    ])

  return {artistStats, memories, testimonials, workshopItems}
}

export async function getPublishedNewsArticle(
  locale: BuiltInAppLocale,
  identifier: string,
): Promise<NewsArticle | null> {
  noStore()

  return contentRepository.newsArticles.findPublishedByIdentifier({
    identifier,
    locale,
  })
}

export async function getPublishedNewsArticles(
  locale: BuiltInAppLocale,
  limit = 50,
): Promise<NewsArticle[]> {
  noStore()

  return contentRepository.newsArticles.listPublished({locale, limit})
}
