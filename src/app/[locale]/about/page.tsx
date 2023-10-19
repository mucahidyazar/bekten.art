import Image from 'next/image'
import {useTranslations} from 'next-intl'

import {prepareMetadata} from '@/utils'

export function generateMetadata() {
  const title = '👋🏼 Home'
  const description =
    '👋🏼 Hi, it is Mucahid. I am a frontend developer and creator of some open source projects since 2017. I am h'

  return prepareMetadata({
    title,
    description,
    page: title,
  })
}

export default function Home() {
  const t = useTranslations()

  return (
    <div id="home" className="flex flex-col gap-6">
      <Image
        src="/usubaliev_1.jpg"
        alt="Bekten Usubaliev"
        width={400}
        height={400}
        className="mx-auto"
      />

      <p>{t('biography1')}</p>
      <p>{t('biography2')}</p>
      <p>{t('biography3')}</p>

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
