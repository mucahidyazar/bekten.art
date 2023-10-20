import Link from 'next/link'

import {EventCard} from '@/components/cards'
import {prepareMetadata} from '@/utils'

export function generateMetadata() {
  const title = '🎨 Latest Updates - Bekten Usubaliev`s Art Exhibitions & News'
  const description =
    '🎨 Stay updated with the latest exhibitions, artworks, and journey of Bekten Usubaliev. Dive into a world where art and emotions intertwine gracefully.'

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
