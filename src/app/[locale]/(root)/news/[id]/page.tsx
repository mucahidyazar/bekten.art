import {BookIcon, ClockIcon, HomeIcon, MapIcon} from 'lucide-react'
import Image from 'next/image'
import {redirect} from 'next/navigation'

import {db} from '@/lib/db'
import {prepareMetadata} from '@/utils/prepareMetadata'

export function generateMetadata() {
  const title = '🎨 Art Detail - Bekten Usubaliev’s `Haver` Masterpiece'
  const description =
    '🎨 Delve into `Haver`, a celebrated artwork by Bekten Usubaliev, encapsulating intricate layers of human emotions, dreams, and spirit. Explore the depths of artistic expression and the untold narratives of the soul.'

  return prepareMetadata({
    title,
    description,
    page: 'event detail',
  })
}

type PageProps = {
  params: {id: string}
}
export default async function Page({params}: PageProps) {
  const news = await db.news.findUnique({
    where: {id: params.id},
    include: {user: true},
  })

  if (!news) {
    return redirect('/404')
  }

  return (
    <div id="event-detail" className="flex flex-col gap-2">
      <div className="h-60 overflow-hidden rounded">
        <Image
          src={news.image}
          alt="Bekten Usubaliev"
          width={400}
          height={400}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <h2 className="mb-2 text-3xl font-semibold text-gray-500">
          {news.title}
        </h2>
        <div className="text-xs text-gray-500">
          {news.address && (
            <p className="flex items-center text-xs text-gray-500">
              <MapIcon className="mr-1 inline h-3 w-3" />
              {news.address}
            </p>
          )}
          {news?.note && (
            <p className="flex items-center">
              <BookIcon className="mr-1 inline h-3 w-3" />
              {news?.note}
            </p>
          )}
          {news?.location && (
            <p className="flex items-center">
              <HomeIcon className="mr-1 inline h-3 w-3" />
              {news?.location}
            </p>
          )}
          {news.date && (
            <p className="flex items-center">
              <ClockIcon className="mr-1 inline h-3 w-3" />
              {new Intl.DateTimeFormat('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(news.date)}
            </p>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-500">{news.description}</div>
    </div>
  )
}
