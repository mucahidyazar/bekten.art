import type {Metadata} from 'next'

import Link from 'next/link'
import {notFound} from 'next/navigation'

import {ArrowLeftIcon, CalendarIcon, ExternalLinkIcon, MapPinIcon} from 'lucide-react'
import {getTranslations} from 'next-intl/server'

import {CallToAction} from '@/components/molecules/call-to-action'
import {Badge} from '@/components/ui/badge'
import {FallbackImage} from '@/components/ui/fallback-image'
import {localizedPath} from '@/lib/localized-path'
import {
  getPublishedNewsArticle,
  getPublishedNewsArticles,
} from '@/services'
import {prepareMetadata} from '@/utils/prepare-metadata'

import type {AppLocale} from '@/lib/localized-path'
import type {NewsArticle} from '@/server/content/domain'

type PageProps = Readonly<{
  params: Promise<{id: string; locale: AppLocale}>
}>

function formatDate(date: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date)
}

function articleDate(article: NewsArticle) {
  return article.eventAt ?? article.publishedAt ?? article.createdAt
}

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {id, locale} = await params
  const [news, t] = await Promise.all([
    getPublishedNewsArticle(locale, id),
    getTranslations({locale, namespace: 'news'}),
  ])

  if (!news) {
    return prepareMetadata({
      description: t('newsNotFoundDescription'),
      robots: {follow: false, index: false},
      title: t('newsNotFound'),
    })
  }

  return prepareMetadata({
    description: news.excerpt,
    openGraph: {
      images: news.imageUrl
        ? [{alt: news.imageAlt ?? news.title, url: news.imageUrl}]
        : undefined,
      publishedTime: news.publishedAt?.toISOString(),
      title: news.title,
      type: 'article',
    },
    page: `news/${news.slug}`,
    title: news.title,
  })
}

export default async function NewsDetailPage({params}: PageProps) {
  const {id, locale} = await params
  const [news, allNews, t] = await Promise.all([
    getPublishedNewsArticle(locale, id),
    getPublishedNewsArticles(locale, 4),
    getTranslations({locale}),
  ])

  if (!news) notFound()

  const relatedNews = allNews.filter(item => item.id !== news.id).slice(0, 3)
  const publishedDate = news.publishedAt ?? news.createdAt

  return (
    <article className="app-container space-y-8 pt-0!">
      <Link
        href={localizedPath(locale, '/news')}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
      >
        <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
        <span>{t('news.backToNews')}</span>
      </Link>

      {news.imageUrl ? (
        <div className="relative h-96 overflow-hidden rounded-2xl md:h-[500px]">
          <div aria-hidden="true" className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <FallbackImage
            alt={news.imageAlt ?? news.title}
            className="object-cover"
            fill
            priority
            src={news.imageUrl}
          />
          <div className="absolute right-0 bottom-0 left-0 z-20 space-y-3 p-8">
            <Badge className="capitalize" variant="secondary">
              {news.category.toLocaleLowerCase(locale)}
            </Badge>
            <h1 className="text-3xl leading-tight font-bold text-white md:text-4xl lg:text-5xl">
              {news.title}
            </h1>
            {news.subtitle ? (
              <p className="text-xl font-medium text-white/90">{news.subtitle}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <header className="space-y-4">
          <Badge className="capitalize" variant="secondary">
            {news.category.toLocaleLowerCase(locale)}
          </Badge>
          <h1 className="text-4xl font-bold lg:text-5xl">{news.title}</h1>
          {news.subtitle ? (
            <p className="text-muted-foreground text-xl">{news.subtitle}</p>
          ) : null}
        </header>
      )}

      <div className="bg-card border-ring/20 grid gap-6 rounded-xl border p-6 md:grid-cols-3">
        <div className="flex items-center gap-3">
          <CalendarIcon aria-hidden="true" className="text-primary h-5 w-5" />
          <div>
            <p className="text-muted-foreground text-sm">{t('news.published')}</p>
            <time className="font-semibold" dateTime={publishedDate.toISOString()}>
              {formatDate(publishedDate, locale)}
            </time>
          </div>
        </div>

        {news.eventAt ? (
          <div className="flex items-center gap-3">
            <CalendarIcon aria-hidden="true" className="text-primary h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm">{t('news.dateTime')}</p>
              <time className="font-semibold" dateTime={news.eventAt.toISOString()}>
                {formatDate(news.eventAt, locale)}
              </time>
            </div>
          </div>
        ) : null}

        {news.location ? (
          <div className="flex items-center gap-3">
            <MapPinIcon aria-hidden="true" className="text-primary h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm">{t('news.location')}</p>
              <p className="font-semibold">{news.location}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-card border-ring/20 space-y-6 rounded-xl border p-8">
        <p className="text-lg leading-8 whitespace-pre-line">{news.body}</p>

        {news.address ? (
          <section className="border-primary bg-primary/5 rounded-r-lg border-l-4 py-4 pl-6">
            <h2 className="mb-2 font-semibold">{t('news.address')}</h2>
            <p className="text-muted-foreground">{news.address}</p>
          </section>
        ) : null}

        {news.note ? (
          <section className="border-accent bg-accent/5 rounded-r-lg border-l-4 py-4 pl-6">
            <h2 className="mb-2 font-semibold">{t('news.importantNote')}</h2>
            <p className="text-muted-foreground">{news.note}</p>
          </section>
        ) : null}

        {news.sourceUrl ? (
          <a
            className="text-primary inline-flex items-center gap-2 font-medium underline-offset-4 hover:underline"
            href={news.sourceUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLinkIcon aria-hidden="true" className="h-4 w-4" />
            {t('common.view')}
          </a>
        ) : null}
      </div>

      {relatedNews.length > 0 ? (
        <section aria-labelledby="related-news-heading" className="space-y-6">
          <h2 id="related-news-heading" className="text-2xl font-bold">
            {t('news.relatedNews')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedNews.map(item => (
              <Link
                className="group bg-card border-ring/20 overflow-hidden rounded-xl border transition-shadow hover:shadow-lg"
                href={localizedPath(locale, `/news/${item.slug}`)}
                key={item.id}
              >
                {item.imageUrl ? (
                  <div className="relative h-32 overflow-hidden">
                    <FallbackImage
                      alt={item.imageAlt ?? item.title}
                      className="object-cover transition-transform group-hover:scale-105"
                      fill
                      src={item.imageUrl}
                    />
                  </div>
                ) : null}
                <div className="space-y-2 p-4">
                  <h3 className="group-hover:text-primary line-clamp-2 font-semibold transition-colors">
                    {item.title}
                  </h3>
                  <time className="text-muted-foreground text-xs" dateTime={articleDate(item).toISOString()}>
                    {formatDate(articleDate(item), locale)}
                  </time>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <CallToAction className="py-0" />
    </article>
  )
}
