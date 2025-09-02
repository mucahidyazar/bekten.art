'use client'

import {NewspaperIcon, ExternalLinkIcon} from 'lucide-react'
import Link from 'next/link'
import { unstable_ViewTransition as ViewTransition } from 'react'

import {mockPressData} from '@/mocks/press'
import {formatDate} from '@/utils/formatDate'

export function PressSection() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <NewspaperIcon className="w-4 h-4 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Press Coverage</h3>
        </div>
        <span className="text-xs text-muted-foreground">Latest mentions</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {mockPressData.map((press) => (
          <ViewTransition key={press.id}>
            <article className="group bg-card border border-ring/20 rounded-lg p-3 hover:shadow-md transition-all duration-300">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium capitalize shrink-0">
                    {press.category}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate('MMMM DD, YYYY', new Date(press.date)).split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
                
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {press.title}
                </h4>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium truncate">
                    {press.source}
                  </span>
                  {press.url && (
                    <Link
                      href={press.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
                    >
                      <ExternalLinkIcon className="w-3 h-3" />
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
