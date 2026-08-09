import {useTranslations} from 'next-intl'

import {ArtImage} from '@/components/molecules/art-image'
import {SectionHeader} from '@/components/molecules/section-header'

import type {AppLocale} from '@/lib/localized-path'
import type {Memory} from '@/server/content/domain'

type MemoriesSectionProps = Readonly<{
  items: Memory[]
  locale: AppLocale
}>

export function MemoriesSection({items, locale}: MemoriesSectionProps) {
  const t = useTranslations('homepage')

  if (items.length === 0) return null

  const dateFormatter = new Intl.DateTimeFormat(locale, {dateStyle: 'long'})

  return (
    <section
      aria-labelledby="memories-heading"
      className="from-muted/30 to-background bg-gradient-to-b py-24"
    >
      <div className="app-container lg:px-0">
        <div id="memories-heading">
          <SectionHeader
            badgeText={t('collectionBadge')}
            badgeIcon="sparkles"
            title={t('collectionTitle')}
            description={t('collectionDescription')}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <article
              id={item.slug}
              key={item.id}
              className="bg-card border-border/50 group overflow-hidden rounded-2xl border shadow-sm"
            >
              <ArtImage
                src={item.imageUrl}
                description={item.imageAlt}
                className="aspect-[4/3]"
                imageClassName="h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="space-y-3 p-6">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                {item.capturedAt ? (
                  <time
                    className="text-muted-foreground block text-sm"
                    dateTime={item.capturedAt.toISOString()}
                  >
                    {dateFormatter.format(item.capturedAt)}
                  </time>
                ) : null}
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
