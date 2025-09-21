import {MetadataRoute} from 'next'

import {createClient} from '@/utils/supabase/server'

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art'
const LOCALES = ['en', 'tr', 'kg', 'ru']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Static pages
  const staticPages = [
    {
      url: '',
      changeFrequency: 'monthly' as const,
      priority: 1,
    },
    {
      url: '/about',
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: '/gallery',
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: '/news',
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: '/contact',
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: '/store',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: '/sign-in',
      changeFrequency: 'yearly' as const,
      priority: 0.1,
    },
    {
      url: '/sign-up',
      changeFrequency: 'yearly' as const,
      priority: 0.1,
    },
  ]

  // Fetch dynamic news pages
  let dynamicPages: Array<{
    url: string
    lastModified: Date
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    priority: number
  }> = []

  try {
    const {data: newsData} = await supabase
      .from('news')
      .select('id, updated_at')
      .eq('published', true)

    if (newsData) {
      const newsPagesForLocales = newsData.flatMap((item: any) =>
        LOCALES.map(locale => ({
          url: `/${locale}/news/${item.id}`,
          lastModified: new Date(item.updated_at),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        })),
      )

      dynamicPages = [...dynamicPages, ...newsPagesForLocales]
    }
  } catch (error) {
    console.error('Error fetching news data for sitemap:', error)
  }

  // Generate sitemap entries for all locales
  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add static pages for all locales
  staticPages.forEach(page => {
    LOCALES.forEach(locale => {
      sitemapEntries.push({
        url: `${DOMAIN}/${locale}${page.url}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: LOCALES.reduce(
            (acc, lang) => {
              acc[lang] = `${DOMAIN}/${lang}${page.url}`

              return acc
            },
            {} as Record<string, string>,
          ),
        },
      })
    })
  })

  // Add dynamic pages (already include locale)
  dynamicPages.forEach(page => {
    sitemapEntries.push({
      url: `${DOMAIN}${page.url}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })
  })

  return sitemapEntries
}
