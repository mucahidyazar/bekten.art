import {Metadata} from 'next'

import Link from 'next/link'
import {notFound} from 'next/navigation'

import {
  ArrowLeftIcon,
  BookmarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ShareIcon,
} from 'lucide-react'
import {unstable_ViewTransition as ViewTransition} from 'react'

import {CallToAction} from '@/components/molecules/call-to-action'
import {Badge} from '@/components/ui/badge'
import {FallbackImage} from '@/components/ui/fallback-image'
import {getSectionData} from '@/services'
import {formatDate} from '@/utils/format-date'
import {prepareMetadata} from '@/utils/prepare-metadata'

import type {NewsDatabaseItem, NewsDatabaseSettings} from '@/types/database'

type PageProps = {
  params: Promise<{id: string}>
}

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {id} = await params

  // Fetch news data from database
  const newsData = (await getSectionData('news')) as {
    items: NewsDatabaseItem[]
    settings: NewsDatabaseSettings | null
  }

  const news = newsData.items.find(item => item.id === id)

  if (!news) {
    const {getTranslations} = await import('next-intl/server')
    const t = await getTranslations('news')

    return prepareMetadata({
      title: t('newsNotFound'),
      description: t('newsNotFoundDescription'),
      page: 'news detail',
    })
  }

  return prepareMetadata({
    title: `🎨 ${news.data.title} - Bekten Usubaliev`,
    description: news.data.description,
    page: 'news detail',
  })
}

export default async function NewsDetailPage({params}: PageProps) {
  const {id} = await params
  const {getTranslations} = await import('next-intl/server')
  const t = await getTranslations()

  // Fetch news data from database
  const newsData = (await getSectionData('news')) as {
    items: NewsDatabaseItem[]
    settings: NewsDatabaseSettings | null
  }

  const news = newsData.items.find(item => item.id === id)

  if (!news) {
    notFound()
  }

  // Get related news (exclude current)
  const relatedNews = newsData.items.filter(item => item.id !== id).slice(0, 3)

  return (
    <div className="container pt-0!">
      {/* Back Navigation */}
      <ViewTransition>
        <Link
          href="/news"
          className="text-muted-foreground hover:text-foreground inline-flex items-center space-x-2 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>{t('news.backToNews')}</span>
        </Link>
      </ViewTransition>

      {/* Hero Image */}
      <div className="relative h-96 overflow-hidden rounded-2xl md:h-[500px]">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <FallbackImage
          src={news.data.image}
          fallbackSrc="/img/empty-event-image.png"
          alt={news.data.title}
          fill
          className="object-cover"
          priority
        />

        {/* Floating Actions */}
        <div className="absolute top-6 right-6 z-20 flex space-x-2">
          <button className="bg-background/80 text-foreground hover:bg-background rounded-full p-2 backdrop-blur-sm transition-colors">
            <ShareIcon className="h-4 w-4" />
          </button>
          <button className="bg-background/80 text-foreground hover:bg-background rounded-full p-2 backdrop-blur-sm transition-colors">
            <BookmarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Title Overlay */}
        <div className="absolute right-0 bottom-0 left-0 z-20 p-8">
          <div className="space-y-3">
            <div className="mb-3">
              <Badge variant="secondary" className="capitalize">
                {news.data.category}
              </Badge>
            </div>
            <h1 className="text-3xl leading-tight font-bold text-white md:text-4xl lg:text-5xl">
              {news.data.title}
            </h1>
            {news.data.subtitle && (
              <p className="text-primary-300 text-xl font-medium">
                {news.data.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Bar */}
      <div className="bg-card border-ring/20 rounded-xl border p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <CalendarIcon className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t('news.dateTime')}
              </p>
              <p className="text-foreground font-semibold">
                {formatDate('MMMM DD, YYYY', new Date(news.data.date))}
              </p>
            </div>
          </div>

          {news.data.location && (
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <MapPinIcon className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {t('news.location')}
                </p>
                <p className="text-foreground font-semibold">
                  {news.data.location}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <ClockIcon className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t('news.published')}
              </p>
              <p className="text-foreground font-semibold">
                {formatDate(
                  'MMMM DD, YYYY',
                  new Date(news.created_at || news.data.date),
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <div className="bg-card border-ring/20 space-y-6 rounded-xl border p-8">
          <div className="text-foreground text-lg leading-relaxed">
            {news.data.description}
          </div>

          {news.data.address && (
            <div className="border-primary bg-primary/5 rounded-r-lg border-l-4 py-4 pl-6">
              <h3 className="text-foreground mb-2 font-semibold">
                {t('news.address')}
              </h3>
              <p className="text-muted-foreground">{news.data.address}</p>
            </div>
          )}

          {news.data.note && (
            <div className="border-accent bg-accent/5 rounded-r-lg border-l-4 py-4 pl-6">
              <h3 className="text-foreground mb-2 font-semibold">
                {t('news.importantNote')}
              </h3>
              <p className="text-muted-foreground">{news.data.note}</p>
            </div>
          )}

          {/* Extended Content */}
          <div className="text-foreground space-y-4 leading-relaxed">
            <p>{t('news.extendedContent1')}</p>

            <p>{t('news.extendedContent2')}</p>

            <p>{t('news.extendedContent3')}</p>
          </div>
        </div>
      </div>

      {/* Related News */}
      {relatedNews.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-foreground text-2xl font-bold">
            {t('news.relatedNews')}
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {relatedNews.map(relatedItem => (
              <ViewTransition key={relatedItem.id}>
                <Link
                  href={`/news/${relatedItem.id}`}
                  className="group bg-card border-ring/20 overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative h-32 overflow-hidden">
                    <FallbackImage
                      src={relatedItem.data.image}
                      fallbackSrc="/img/empty-event-image.png"
                      alt={relatedItem.data.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="space-y-2 p-4">
                    <h3 className="text-foreground group-hover:text-primary line-clamp-2 font-semibold transition-colors">
                      {relatedItem.data.title}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(
                        'MMMM DD, YYYY',
                        new Date(relatedItem.data.date),
                      )}
                    </p>
                  </div>
                </Link>
              </ViewTransition>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <CallToAction className="py-0" />
    </div>
  )
}
