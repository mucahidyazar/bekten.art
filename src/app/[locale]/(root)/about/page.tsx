import Image from 'next/image'
import {useTranslations} from 'next-intl'

import {prepareMetadata} from '@/utils/prepareMetadata'

export function generateMetadata() {
  const title = '🎨 About Bekten Usubaliev - Kyrgyz Painter & Art Lecturer'
  const description =
    '🎨 Learn about Bekten Usubaliev’s artistic journey, his philosophy, and his contributions to art. A painter who believes in the power of art to unveil the hidden realms of human emotions and dreams.'

  return prepareMetadata({
    title,
    description,
    page: 'about',
  })
}

export default function Home() {
  const t = useTranslations()

  return (
    <div id="about" className="flex flex-col gap-6">
      <Image
        src="/usubaliev_1.jpg"
        alt="Bekten Usubaliev"
        width={400}
        height={400}
        className="mx-auto"
      />

      <div className="text-gray-500">
        <p>{t('biography1')}</p>
        <p>{t('biography2')}</p>
        <p>{t('biography3')}</p>
      </div>

      <Image
        src="/usubaliev_2.jpg"
        alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
        width={400}
        height={400}
        className="mx-auto"
      />
    </div>
  )
}
