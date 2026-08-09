'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {cn} from '@/utils'

type Tab = {
  value: string
  label: string
}

type TabsProps = {
  tabs: Tab[]
}

export function Tabs({tabs}: TabsProps) {
  const pathname = usePathname()

  return (
    <nav aria-label="Authentication" className="grid grid-cols-2 gap-1">
      {tabs.map(tab => {
        const isActive = pathname === tab.value

        return (
          <Link
            key={tab.value}
            href={tab.value}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-md border px-4 py-2 text-center text-sm font-medium transition-colors',
              isActive
                ? 'border-ring/40 bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/60 hover:border-ring/20 border-transparent',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
