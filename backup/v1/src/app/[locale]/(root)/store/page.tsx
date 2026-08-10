import {NewsletterCTA} from '@/components/molecules/newsletter-cta'
import {StoreSection} from '@/components/sections/store-section'
import {getPublishedStoreArtworks} from '@/services'

import type {AppLocale} from '@/lib/localized-path'

type PageProps = Readonly<{params: Promise<{locale: AppLocale}>}>

export default async function StorePage({params}: PageProps) {
  const {locale} = await params
  const artworks = await getPublishedStoreArtworks(locale)

  return (
    <div className="app-container">
      <StoreSection items={artworks} locale={locale} />

      {/* Newsletter CTA */}
      <NewsletterCTA />
    </div>
  )
}
