'use client'

import Link from 'next/link'

import {ExternalLinkIcon, NewspaperIcon} from 'lucide-react'
import {unstable_ViewTransition as ViewTransition} from 'react'

import {mockPressData} from '@/mocks/press'
import {formatDate} from '@/utils/format-date'

export function PressSection() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <NewspaperIcon className="text-primary h-4 w-4" />
          <h3 className="text-foreground text-lg font-semibold">
            Press Coverage
          </h3>
        </div>
        <span className="text-muted-foreground text-xs">Latest mentions</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {mockPressData.map(press => (
          <ViewTransition key={press.id}>
            <article className="group bg-card border-ring/20 rounded-lg border p-3 transition-all duration-300 hover:shadow-md">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="bg-primary/10 text-primary shrink-0 rounded px-2 py-0.5 text-xs font-medium capitalize">
                    {press.category}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDate('MMMM DD, YYYY', new Date(press.date))
                      .split(' ')
                      .slice(0, 2)
                      .join(' ')}
                  </span>
                </div>

                <h4 className="text-foreground group-hover:text-primary line-clamp-2 text-sm leading-tight font-semibold transition-colors">
                  {press.title}
                </h4>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground truncate text-xs font-medium">
                    {press.source}
                  </span>
                  {press.url && (
                    <Link
                      href={press.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 inline-flex shrink-0 items-center text-xs transition-colors"
                    >
                      <ExternalLinkIcon className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          </ViewTransition>
        ))}
      </div>
    </div>
  )
}
