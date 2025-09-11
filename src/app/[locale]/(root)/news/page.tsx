import {Metadata} from 'next'

import {CallToAction} from '@/components/molecules/call-to-action'
import {NewsSection} from '@/components/sections/news-section'
import {getSectionData} from '@/services'
import {prepareMetadata} from '@/utils/prepare-metadata'

import type {NewsDatabaseItem, NewsDatabaseSettings} from '@/types/database'

export async function generateMetadata(): Promise<Metadata> {
  const {getTranslations} = await import('next-intl/server')
  const t = await getTranslations('news')

  return prepareMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    page: 'news',
  })
}

export default async function NewsPage() {
  // Fetch news data from database
  const newsData = (await getSectionData('news')) as {
    items: NewsDatabaseItem[]
    settings: NewsDatabaseSettings | null
  }

  return (
    <>
      <NewsSection newsData={newsData} />
      {/* Call to Action */}
      <CallToAction />
    </>
  )
}
