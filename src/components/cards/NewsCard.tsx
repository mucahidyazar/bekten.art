'use client'
import {ClockIcon, HomeIcon, MapIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import {cn} from '@/utils'

type NewsCardProps = {
  news: any // TODO: Define proper type with Supabase
  className?: string
}

export function NewsCard({news, className}: NewsCardProps) {
  return (
    <div
      className={cn(
        'group flex w-full flex-col gap-2 rounded border border-gray-200 p-4 shadow-md transition-all duration-300 hover:shadow-lg',
        className,
      )}
    >
      <div className="relative h-60 w-full overflow-hidden rounded">
        <Image
          src={news?.image || '/img/empty-event-image.png'}
          alt={news?.title || 'News'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {news?.title}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {news?.description}
        </p>

        <div className="flex flex-col gap-1 text-xs text-gray-500">
          {news?.address && (
            <div className="flex items-center gap-1">
              <MapIcon className="h-3 w-3" />
              <span>{news.address}</span>
            </div>
          )}
          
          {news?.location && (
            <div className="flex items-center gap-1">
              <HomeIcon className="h-3 w-3" />
              <span>{news.location}</span>
            </div>
          )}
          
          {news?.date && (
            <div className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              <span>
                {new Intl.DateTimeFormat('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(new Date(news.date))}
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-between items-center">
          <Link
            href={`/news/${news?.id}`}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Read More
          </Link>
        </div>
      </div>
    </div>
  )
}