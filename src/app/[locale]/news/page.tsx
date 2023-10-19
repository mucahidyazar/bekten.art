import Link from 'next/link'

import {EventCard} from '@/components/cards'
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
    <div id="home" className="flex flex-col gap-4">
      <Link href={`/news/1`}>
        <EventCard />
      </Link>
      <Link href={`/news/1`}>
        <EventCard />
      </Link>
      <Link href={`/news/1`}>
        <EventCard />
      </Link>
    </div>
  )
}
