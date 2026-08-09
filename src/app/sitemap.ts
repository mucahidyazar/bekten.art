import {MetadataRoute} from 'next'

import {prisma} from '@/lib/db'
import {
  APP_LOCALES,
  localizedAlternates,
  localizedPath,
} from '@/lib/localized-path'

import type {AppLocale} from '@/lib/localized-path'

export const dynamic = 'force-dynamic'

const DOMAIN = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art')
  .origin

const STATIC_PAGES = [
  {path: '/', changeFrequency: 'monthly', priority: 1},
  {path: '/about', changeFrequency: 'monthly', priority: 0.8},
  {path: '/gallery', changeFrequency: 'weekly', priority: 0.9},
  {path: '/news', changeFrequency: 'weekly', priority: 0.7},
  {path: '/contact', changeFrequency: 'monthly', priority: 0.6},
  {path: '/store', changeFrequency: 'weekly', priority: 0.8},
] as const

function isAppLocale(locale: string): locale is AppLocale {
  return APP_LOCALES.some(candidate => candidate === locale)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.flatMap(page => {
    const languages = localizedAlternates(DOMAIN, page.path)

    return APP_LOCALES.map(locale => ({
      url: `${DOMAIN}${localizedPath(locale, page.path)}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {languages},
    }))
  })

  try {
    const newsData = await prisma.newsArticle.findMany({
      orderBy: {updatedAt: 'desc'},
      select: {
        locale: true,
        slug: true,
        updatedAt: true,
      },
      where: {status: 'PUBLISHED'},
    })

    newsData.forEach(item => {
      if (!isAppLocale(item.locale)) {
        return
      }

      const publicPath = `/news/${encodeURIComponent(item.slug)}`

      entries.push({
        url: `${DOMAIN}${localizedPath(item.locale, publicPath)}`,
        lastModified: item.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    })
  } catch (error) {
    console.error('Error fetching news data for sitemap:', error)
  }

  return entries
}
