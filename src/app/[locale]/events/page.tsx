import Link from 'next/link'

import {EventCard} from '@/components/cards'
import {prepareMetadata} from '@/utils/prepareMetadata'

export function generateMetadata() {
  const title = '🎨 Latest Updates - Bekten Usubaliev`s Art Exhibitions & News'
  const description =
    '🎨 Stay updated with the latest exhibitions, artworks, and journey of Bekten Usubaliev. Dive into a world where art and emotions intertwine gracefully.'

  return prepareMetadata({
    title,
    description,
    page: 'events',
  })
}

export default function Home() {
  return (
    <div id="events" className="flex flex-col gap-4">
      <Link href={`/news/1`}>
        <EventCard
          title="Bekten Usubaliev`s Art Exhibition"
          description="Bekten Usubaliev`s Art Exhibition"
          image="/img/workshop/workshop-0.jpeg"
        />
      </Link>
      <Link href={`/news/1`}>
        <EventCard
          title="Bekten Usubaliev`s Art Exhibition"
          description="Bekten Usubaliev`s Art Exhibition"
          image="/img/workshop/workshop-0.jpeg"
        />
      </Link>
      <Link href={`/news/1`}>
        <EventCard
          title="Bekten Usubaliev`s Art Exhibition"
          description="Bekten Usubaliev`s Art Exhibition"
          image="/img/workshop/workshop-0.jpeg"
        />
      </Link>
    </div>
  )
}
