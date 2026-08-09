import Link from 'next/link'

import {ArrowRightIcon, CalendarIcon, MapPinIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {SectionHeader} from '@/components/molecules/section-header'
import {Badge} from '@/components/ui/badge'
import {FallbackImage} from '@/components/ui/fallback-image'
import {localizedPath} from '@/lib/localized-path'

import type {AppLocale} from '@/lib/localized-path'
import type {NewsArticle} from '@/server/content/domain'

type NewsSectionProps = Readonly<{
  items: NewsArticle[]
  locale: AppLocale
}>

export function NewsSection({items, locale}: NewsSectionProps) {
  const t = useTranslations('news')
  const dateFormatter = new Intl.DateTimeFormat(locale, {dateStyle: 'long'})

  return (
    <section
      aria-labelledby="news-index-heading"
      className="app-container py-12 lg:py-20"
    >
      <div id="news-index-heading">
        <SectionHeader
          badgeText={t('latestUpdates')}
          badgeIcon="newspaper"
          title={t('allNewsEvents')}
          description={t('newsDescription')}
        />
      </div>

      {items.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const publishedDate = item.eventAt ?? item.publishedAt

            return (
              <article
                key={item.id}
                className="bg-card border-border/50 group overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-xl"
              >
                {item.imageUrl ? (
                  <Link href={localizedPath(locale, `/news/${item.slug}`)}>
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <FallbackImage
                        src={item.imageUrl}
                        alt={item.imageAlt ?? item.title}
                        fill
                        priority={index === 0}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                ) : null}

                <div className="space-y-4 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="secondary">{item.category}</Badge>
                    {publishedDate ? (
                      <time
                        className="text-muted-foreground flex items-center gap-1 text-sm"
                        dateTime={publishedDate.toISOString()}
                      >
                        <CalendarIcon aria-hidden="true" className="h-4 w-4" />
                        {dateFormatter.format(publishedDate)}
                      </time>
                    ) : null}
                  </div>

                  <h2 className="text-2xl font-semibold">
                    <Link
                      className="hover:text-primary transition-colors"
                      href={localizedPath(locale, `/news/${item.slug}`)}
                    >
                      {item.title}
                    </Link>
                  </h2>
                  {item.subtitle ? (
                    <p className="font-medium">{item.subtitle}</p>
                  ) : null}
                  <p className="text-muted-foreground line-clamp-4 leading-relaxed">
                    {item.excerpt}
                  </p>

                  {item.location ? (
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                      <MapPinIcon aria-hidden="true" className="h-4 w-4" />
                      {item.location}
                    </p>
                  ) : null}

                  <Link
                    href={localizedPath(locale, `/news/${item.slug}`)}
                    className="text-primary inline-flex items-center gap-2 font-medium"
                  >
                    {t('readMore')}
                    <ArrowRightIcon aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground py-16 text-center">
          {t('newsNotFound')}
        </p>
      )}
    </section>
  )
}
