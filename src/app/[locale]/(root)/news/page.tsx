import {CalendarIcon, ClockIcon, MapPinIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {unstable_ViewTransition as ViewTransition} from 'react'

import {NewsletterCTA} from '@/components/molecules/newsletter-cta'
import {SectionHeader} from '@/components/molecules/section-header'
import {mockNewsData} from '@/mocks/news'
import {formatDate} from '@/utils/format-date'
import {prepareMetadata} from '@/utils/prepare-metadata'

import {PressSection} from './components/press-section'

export async function generateMetadata() {
  const {getTranslations} = await import('next-intl/server')
  const t = await getTranslations('news')

  return await prepareMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    page: 'news',
  })
}

export default async function NewsPage() {
  const {getTranslations} = await import('next-intl/server')
  const t = await getTranslations()

  // Sort news by date (newest first)
  const sortedNews = mockNewsData.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  const featuredNews = sortedNews[0]
  const otherNews = sortedNews.slice(1)

  return (
    <div className="container">
      {/* Featured News & Press Coverage */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Featured News */}
        {featuredNews && (
          <div className="pt-11 lg:col-span-2">
            <div className="bg-card border-ring/20 relative overflow-hidden rounded-2xl border shadow-xl sm:max-h-[490px]">
              <div className="grid gap-0 lg:grid-cols-2">
                {/* Image */}
                <div className="relative h-80 lg:h-auto">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 to-transparent" />
                  <Image
                    src={featuredNews.image}
                    alt={featuredNews.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-medium">
                      {t('news.featured')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center p-6 lg:p-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h2 className="text-foreground text-2xl leading-tight font-bold lg:text-3xl">
                        {featuredNews.title}
                      </h2>
                      {featuredNews.subtitle && (
                        <p className="text-primary text-base font-medium">
                          {featuredNews.subtitle}
                        </p>
                      )}
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      {featuredNews.description}
                    </p>

                    {/* Event Details */}
                    <div className="space-y-2">
                      <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                        <CalendarIcon className="text-primary h-4 w-4" />
                        <span className="font-medium">
                          {formatDate('MMMM DD, YYYY', featuredNews.date)}
                        </span>
                      </div>

                      {featuredNews.location && (
                        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                          <MapPinIcon className="text-primary h-4 w-4" />
                          <span>{featuredNews.location}</span>
                        </div>
                      )}
                    </div>

                    <ViewTransition>
                      <Link
                        href={`/news/${featuredNews.id}`}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                      >
                        <span>{t('news.readMore')}</span>
                        <ClockIcon className="h-3 w-3" />
                      </Link>
                    </ViewTransition>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Press Coverage */}
        <div className="h-full lg:col-span-1">
          <div className="h-full max-h-[534px]">
            <PressSection />
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="space-y-8">
        <SectionHeader
          badgeText={t('news.latestUpdates')}
          badgeIcon="newspaper"
          title={t('news.allNewsEvents')}
          description={t('news.newsDescription')}
          className="mb-8"
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {otherNews.map(news => (
            <ViewTransition key={news.id}>
              <article className="group bg-card border-ring/20 overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={news.image}
                    alt={news.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="space-y-4 p-6">
                  <div className="space-y-2">
                    <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-xl font-bold transition-colors">
                      {news.title}
                    </h3>
                    {news.subtitle && (
                      <p className="text-primary text-sm font-medium">
                        {news.subtitle}
                      </p>
                    )}
                  </div>

                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                    {news.description}
                  </p>

                  {/* Event Info */}
                  <div className="text-muted-foreground space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="text-primary h-3 w-3" />
                      <span>{formatDate('MMMM DD, YYYY', news.date)}</span>
                    </div>

                    {news.location && (
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="text-primary h-3 w-3" />
                        <span className="line-clamp-1">{news.location}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/news/${news.id}`}
                    className="text-primary hover:text-primary/80 inline-flex items-center text-sm font-medium transition-colors"
                  >
                    {t('news.readMore')} →
                  </Link>
                </div>
              </article>
            </ViewTransition>
          ))}
        </div>
      </div>

      {/* Newsletter CTA */}
      <NewsletterCTA />
    </div>
  )
}
