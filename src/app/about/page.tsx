import Image from 'next/image'

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
  return (
    <div id="home" className="flex flex-col gap-6">
      <Image
        src="/usubaliev_1.jpg"
        alt="Bekten Usubaliev"
        width={400}
        height={400}
        className="mx-auto"
      />
      <p>
        Bekten Usubaliev is a Kyrgyz painter who believes that art reveals the
        dreams, feelings, and independent spirit hidden within man. Not only
        does his artwork speak volumes, so does Bekten as a lecturer at the
        Kyrgyz State Art College, where he has taught since 1990. Born in 1958,
        he graduated from the Kyrgyz State Art College in 1981 and later earned
        a degree from the Repin Institute of Architecture, Sculpture, and
        Painting in St. Petersburg, Russia in 1989. He joined the Artists` Union
        of the Kyrgyz Republic in 1991.
      </p>

      <p>
        Bekten has shown his works in numerous national and international
        exhibitions, including a group exhibition of young artists in Almaty,
        Kazakhstan (1995); the second international biennale exhibition
        `Dialogues` in St. Petersburg, Russia (1995); the 70th anniversary
        celebration for Ch. Aitmatov in Brussels, Belgium (1997); an
        international exhibition in Teheran, Iran (2000); and a solo show in
        Bishkek (2001).
      </p>

      <p>
        His works can be seen at the Kyrgyz State Museum of Fine Art and in
        private collections throughout the CIS, USA, Germany, Turkey, and Great
        Britain.
      </p>
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
