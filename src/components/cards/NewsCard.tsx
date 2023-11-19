import {News, User} from '@prisma/client'
import {ClockIcon, HomeIcon, MapIcon, PencilIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import {cn} from '@/utils'

type NewsCardProps = {
  news: News & {
    user: User
  }
  className?: string
}
export function NewsCard({news, className}: NewsCardProps) {
  return (
    <Link
      className={cn(
        'group flex h-[19.5rem] w-96 flex-col overflow-hidden rounded bg-primary-500 bg-opacity-5 pb-2 shadow hover:shadow-md',
        className,
      )}
      href={`/news/${news.id}`}
    >
      <div className="flex h-full flex-col justify-between">
        <Image
          src={news.image}
          alt="Bekten Usubaliev"
          width={400}
          height={400}
          className="h-52 w-full object-cover duration-300 group-hover:h-28"
        />
        <div className="px-2 group-hover:-mt-4">
          <h3 className="text-foreground">{news.title}</h3>
          {news.subtitle && (
            <p className="text-sm text-primary-500">{news.subtitle}</p>
          )}
          {news.address && (
            <p className="flex items-center text-xs text-gray-500">
              <MapIcon className="mr-1 inline h-3 w-3" />
              {news.address}
            </p>
          )}
          <p className="line-clamp-3 h-0 overflow-hidden text-xs duration-150 group-hover:h-[4rem] group-hover:pt-2">
            {news.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 px-2 text-[10px] text-gray-500">
          <p className="flex items-center">
            <PencilIcon className="mr-1 inline h-3 w-3" />
            {news.user.name}
          </p>
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
    </Link>
  )
}
