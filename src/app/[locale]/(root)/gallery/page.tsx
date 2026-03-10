import {Metadata} from 'next'

import {GalleryTemplate} from '@/components/templates/gallery-template'
import {getGalleryImageArrays} from '@/lib/instagram-gallery'
import {prepareMetadata} from '@/utils/prepare-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const {getTranslations} = await import('next-intl/server')
  const t = await getTranslations('gallery')

  return prepareMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    page: 'gallery',
  })
}

export default async function Home() {
  const imagesArrays = await getGalleryImageArrays()

  return (
    <div className="container">
      <div id="gallery" className="px-1 lg:px-4">
        <GalleryTemplate imageArrays={imagesArrays} />
      </div>
    </div>
  )
}
