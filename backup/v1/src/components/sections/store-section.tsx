import Link from 'next/link'

import {BadgeDollarSign, CheckCircle2, Mail} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {ArtImage} from '@/components/molecules/art-image'
import {SectionHeader} from '@/components/molecules/section-header'
import {Badge} from '@/components/ui/badge'
import {buttonVariants} from '@/components/ui/button'
import {localizedPath} from '@/lib/localized-path'

import type {AppLocale} from '@/lib/localized-path'
import type {Artwork} from '@/server/content/domain'

type StoreSectionProps = Readonly<{
  items: Artwork[]
  locale: AppLocale
}>

function artworkPrice(artwork: Artwork, locale: AppLocale) {
  if (artwork.priceMinor === null || artwork.currency === null) return null

  return new Intl.NumberFormat(locale, {
    currency: artwork.currency,
    style: 'currency',
  }).format(artwork.priceMinor / 100)
}

export function StoreSection({items, locale}: StoreSectionProps) {
  const t = useTranslations('store')

  return (
    <section aria-labelledby="store-heading" className="py-12 lg:py-20">
      <div id="store-heading">
        <SectionHeader
          badgeText={t('storeBadge')}
          badgeIcon="palette"
          title={t('artStore')}
          description={t('newsletterDescription')}
        />
      </div>

      {items.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(artwork => {
            const price = artworkPrice(artwork, locale)

            return (
              <article
                id={artwork.slug}
                key={artwork.id}
                className="bg-card border-border/50 group scroll-mt-28 overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-xl"
              >
                <ArtImage
                  src={artwork.imageUrl}
                  description={artwork.imageAlt}
                  className="aspect-[4/5]"
                  imageClassName="h-full transition-transform duration-500 group-hover:scale-105"
                />

                <div className="space-y-4 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {artwork.medium ? (
                      <Badge variant="secondary">{artwork.medium}</Badge>
                    ) : (
                      <span />
                    )}
                    <span className="text-muted-foreground text-sm">
                      {artwork.year}
                    </span>
                  </div>

                  <h2 className="text-2xl font-semibold">{artwork.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {artwork.description}
                  </p>

                  <dl className="text-muted-foreground space-y-2 text-sm">
                    {artwork.dimensions ? (
                      <div className="flex justify-between gap-4">
                        <dt>{t('mainImage')}</dt>
                        <dd className="text-foreground text-right">
                          {artwork.dimensions}
                        </dd>
                      </div>
                    ) : null}
                    {price ? (
                      <div className="flex items-center justify-between gap-4">
                        <dt className="flex items-center gap-1">
                          <BadgeDollarSign
                            aria-hidden="true"
                            className="h-4 w-4"
                          />
                          {t('price')}
                        </dt>
                        <dd className="text-foreground font-semibold">
                          {price}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="flex items-center justify-between gap-4 border-t pt-4">
                    <span className="text-sm font-medium">
                      {artwork.isAvailable ? (
                        <span className="text-primary inline-flex items-center gap-2">
                          <CheckCircle2
                            aria-hidden="true"
                            className="h-4 w-4"
                          />
                          {t('available')}
                        </span>
                      ) : (
                        t('unavailable')
                      )}
                    </span>
                    {artwork.isAvailable ? (
                      <Link
                        href={localizedPath(locale, '/contact')}
                        className={buttonVariants({size: 'sm'})}
                      >
                        <Mail aria-hidden="true" className="mr-2 h-4 w-4" />
                        {t('inquire')}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground py-16 text-center">
          {t('noArtworksFound')}
        </p>
      )}
    </section>
  )
}
