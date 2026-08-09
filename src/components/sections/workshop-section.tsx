import Link from 'next/link'

import {CalendarDays, MapPin, PaletteIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {ArtImage} from '@/components/molecules/art-image'
import {SectionHeader} from '@/components/molecules/section-header'
import {buttonVariants} from '@/components/ui/button'
import {cn} from '@/utils'

import type {AppLocale} from '@/lib/localized-path'
import type {WorkshopItem} from '@/server/content/domain'

type WorkshopSectionProps = Readonly<{
  items: WorkshopItem[]
  locale: AppLocale
}>

function formatWorkshopDate(locale: AppLocale, date: Date) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function WorkshopSection({items, locale}: WorkshopSectionProps) {
  const t = useTranslations('homepage')

  if (items.length === 0) return null

  return (
    <section aria-labelledby="workshop-heading" className="relative py-24">
      <div className="app-container lg:px-0">
        <div id="workshop-heading">
          <SectionHeader
            badgeText={t('workshopBadge')}
            badgeIcon="palette"
            title={t('workshopTitle')}
            description={t('workshopDescription')}
            className="mb-14"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              className={cn(
                'bg-card border-border/50 group overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-xl',
                index === 0 && 'md:col-span-2 lg:col-span-2 lg:row-span-2',
              )}
            >
              {item.imageUrl ? (
                <ArtImage
                  src={item.imageUrl}
                  description={item.imageAlt ?? item.title}
                  className={index === 0 ? 'h-80 lg:h-[28rem]' : 'h-64'}
                  imageClassName="h-full transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}

              <div className="space-y-4 p-6">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                <dl className="text-muted-foreground space-y-2 text-sm">
                  {item.startsAt ? (
                    <div className="flex items-center gap-2">
                      <CalendarDays aria-hidden="true" className="h-4 w-4" />
                      <dt className="sr-only">Date</dt>
                      <dd>{formatWorkshopDate(locale, item.startsAt)}</dd>
                    </div>
                  ) : null}
                  {item.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin aria-hidden="true" className="h-4 w-4" />
                      <dt className="sr-only">Location</dt>
                      <dd>{item.location}</dd>
                    </div>
                  ) : null}
                </dl>

                {item.registrationUrl ? (
                  <Link
                    href={item.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({variant: 'outline'})}
                  >
                    <PaletteIcon aria-hidden="true" className="mr-2 h-4 w-4" />
                    {t('workshopBadge')}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
