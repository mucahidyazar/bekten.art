import Link from 'next/link'

import {ArrowRightIcon, HeartIcon, PaletteIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {SectionHeader} from '@/components/molecules/section-header'
import {buttonVariants} from '@/components/ui/button'
import {localizedPath} from '@/lib/localized-path'
import {cn} from '@/utils'

import type {AppLocale} from '@/lib/localized-path'
import type {ArtistStat} from '@/server/content/domain'

type ArtistSectionProps = Readonly<{
  items: ArtistStat[]
  locale: AppLocale
}>

export function ArtistSection({items, locale}: ArtistSectionProps) {
  const t = useTranslations('homepage')

  if (items.length === 0) return null

  return (
    <section
      aria-labelledby="artist-section-heading"
      className="from-background via-muted/20 to-background bg-gradient-to-b py-24"
    >
      <div className="app-container lg:px-0">
        <div id="artist-section-heading">
          <SectionHeader
            badgeText={t('artistBadge')}
            badgeIcon="heart"
            title={t('artistName')}
            description={t('artistDescription')}
          />
        </div>

        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-card border-border/50 rounded-2xl border p-7 shadow-sm"
            >
              <dt className="space-y-2">
                <span className="text-primary block text-4xl font-bold">
                  {item.value}
                </span>
                <span className="block text-lg font-semibold">{item.label}</span>
              </dt>
              <dd className="text-muted-foreground mt-3 leading-relaxed">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href={localizedPath(locale, '/about')}
            className={cn(buttonVariants({size: 'lg'}), 'group')}
          >
            <HeartIcon aria-hidden="true" className="mr-2 h-4 w-4" />
            {t('statsButton1')}
            <ArrowRightIcon
              aria-hidden="true"
              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
          <Link
            href={localizedPath(locale, '/gallery')}
            className={buttonVariants({size: 'lg', variant: 'outline'})}
          >
            <PaletteIcon aria-hidden="true" className="mr-2 h-4 w-4" />
            {t('statsButton2')}
          </Link>
        </div>
      </div>
    </section>
  )
}
