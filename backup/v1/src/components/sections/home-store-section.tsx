import Link from 'next/link'

import {ArrowRightIcon, BadgeDollarSign, CheckCircle2} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {ArtImage} from '@/components/molecules/art-image'
import {SectionHeader} from '@/components/molecules/section-header'
import {Badge} from '@/components/ui/badge'
import {buttonVariants} from '@/components/ui/button'
import {localizedPath} from '@/lib/localized-path'
import {cn} from '@/utils'

import type {AppLocale} from '@/lib/localized-path'
import type {Artwork} from '@/server/content/domain'

type HomeStoreSectionProps = Readonly<{
  items: Artwork[]
  locale: AppLocale
}>

function formatPrice(artwork: Artwork, locale: AppLocale) {
  if (artwork.priceMinor === null || artwork.currency === null) return null

  return new Intl.NumberFormat(locale, {
    currency: artwork.currency,
    style: 'currency',
  }).format(artwork.priceMinor / 100)
}

export function HomeStoreSection({items, locale}: HomeStoreSectionProps) {
  const t = useTranslations('homepage')
  const storeT = useTranslations('store')
  const featured = items.filter(item => item.isAvailable).slice(0, 3)
  const visibleItems = featured.length > 0 ? featured : items.slice(0, 3)

  if (visibleItems.length === 0) return null

  return (
    <section aria-label={t('storeTitle')} className="py-24">
      <div className="app-container lg:px-0">
        <SectionHeader
          badgeText={t('storeBadge')}
          badgeIcon="award"
          title={t('storeTitle')}
          description={t('storeDescription')}
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((artwork, index) => {
            const price = formatPrice(artwork, locale)

            return (
              <article
                id={artwork.slug}
                key={artwork.id}
                className="bg-card border-border/50 group overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-xl"
              >
                <Link href={localizedPath(locale, `/store#${artwork.slug}`)}>
                  <ArtImage
                    src={artwork.imageUrl}
                    description={artwork.imageAlt}
                    className="aspect-[4/5]"
                    imageClassName="h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                <div className="space-y-4 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {artwork.medium ? (
                      <Badge variant="secondary">{artwork.medium}</Badge>
                    ) : (
                      <span />
                    )}
                    {artwork.isAvailable ? (
                      <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
                        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                        {storeT('available')}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-xl font-semibold">{artwork.title}</h3>
                  <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                    {artwork.description}
                  </p>
                  {price ? (
                    <p className="flex items-center gap-2 text-lg font-semibold">
                      <BadgeDollarSign
                        aria-hidden="true"
                        className="text-primary h-5 w-5"
                      />
                      {price}
                    </p>
                  ) : null}
                  {index === 0 ? (
                    <Link
                      href={localizedPath(locale, `/store#${artwork.slug}`)}
                      className={cn(
                        buttonVariants({variant: 'outline'}),
                        'group/link',
                      )}
                    >
                      {storeT('viewDetails')}
                      <ArrowRightIcon
                        aria-hidden="true"
                        className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1"
                      />
                    </Link>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href={localizedPath(locale, '/store')}
            className={buttonVariants({size: 'lg'})}
          >
            {t('storeBadge')}
            <ArrowRightIcon aria-hidden="true" className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
