import {NewsletterCTA} from '@/components/molecules/newsletter-cta'
import {StoreSection} from '@/components/sections/store-section'
import {getSectionData} from '@/services'

import type {StoreDatabaseItem, StoreDatabaseSettings} from '@/types/database'

export default async function StorePage() {
  // Fetch store data from database
  const storeData = (await getSectionData('store')) as {
    items: StoreDatabaseItem[]
    settings: StoreDatabaseSettings | null
  }

  return (
    <div className="container">
      {/* Store Content - Section Component */}
      <StoreSection storeData={storeData} />

      {/* Newsletter CTA */}
      <NewsletterCTA />
    </div>
  )
}
