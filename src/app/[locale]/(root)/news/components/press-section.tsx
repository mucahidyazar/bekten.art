import Link from 'next/link'

import {ExternalLinkIcon, NewspaperIcon} from 'lucide-react'

import {contentRepository} from '@/server/database/content'

import type {AppLocale} from '@/lib/localized-path'
import type {PressItem} from '@/server/content/domain'

type PressSectionProps = Readonly<{
  locale: AppLocale
}>

function formatPublishedDate(item: PressItem, locale: AppLocale) {
  const date = item.publishedOn ?? item.publishedAt ?? item.createdAt

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)
}

function safeSourceUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl)

    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export async function PressSection({locale}: PressSectionProps) {
  const labels = pressCopy[locale]
  const pressItems = await contentRepository.pressItems.listPublished({
    limit: 8,
    locale,
  })

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <NewspaperIcon className="text-primary h-4 w-4" />
          <h3
            className="text-foreground text-lg font-semibold"
            id="press-section-title"
          >
            {labels.title}
          </h3>
        </div>
        <span className="text-muted-foreground text-xs">{labels.latest}</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {pressItems.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border p-4 text-sm">
            {labels.empty}
          </p>
        ) : (
          pressItems.map(press => {
            const sourceUrl = safeSourceUrl(press.sourceUrl)

            return (
              <article
                className="group bg-card border-ring/20 rounded-lg border p-3 transition-all duration-300 hover:shadow-md"
                key={press.id}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-primary/10 text-primary shrink-0 rounded px-2 py-0.5 text-xs font-medium capitalize">
                      {press.category.toLocaleLowerCase(locale)}
                    </span>
                    <time
                      className="text-muted-foreground shrink-0 text-xs"
                      dateTime={(
                        press.publishedOn ??
                        press.publishedAt ??
                        press.createdAt
                      ).toISOString()}
                    >
                      {formatPublishedDate(press, locale)}
                    </time>
                  </div>

                  <h4 className="text-foreground group-hover:text-primary line-clamp-2 text-sm leading-tight font-semibold transition-colors">
                    {press.title}
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground truncate text-xs font-medium">
                      {press.outlet}
                    </span>
                    {sourceUrl && (
                      <Link
                        aria-label={`${labels.readFrom} ${press.outlet}`}
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 inline-flex shrink-0 items-center text-xs transition-colors"
                      >
                        <ExternalLinkIcon
                          aria-hidden="true"
                          className="h-3 w-3"
                        />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

const pressCopy = {
  en: {
    empty: 'No press coverage has been published yet.',
    latest: 'Latest mentions',
    readFrom: 'Read the coverage from',
    title: 'Press coverage',
  },
  ky: {
    empty: 'Азырынча басма сөз материалдары жарыялана элек.',
    latest: 'Акыркы материалдар',
    readFrom: 'Материалды бул булактан окуу:',
    title: 'Басма сөздө',
  },
  ru: {
    empty: 'Публикаций в прессе пока нет.',
    latest: 'Последние упоминания',
    readFrom: 'Прочитать публикацию в',
    title: 'Публикации в прессе',
  },
  tr: {
    empty: 'Henüz yayımlanmış bir basın haberi bulunmuyor.',
    latest: 'Son haberler',
    readFrom: 'Haberi şu kaynaktan oku:',
    title: 'Basında',
  },
} as const
