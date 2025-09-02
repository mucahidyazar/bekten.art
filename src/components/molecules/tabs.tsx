'use client'

import {usePathname, useRouter} from 'next/navigation'

import {cn} from '@/utils'

type Tab = {
  value: string
  label: string
}

type TabsProps = {
  tabs: Tab[]
}

export function Tabs({tabs}: TabsProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="grid grid-cols-2 gap-1">
      {tabs.map(tab => {
        const isActive = pathname.includes(tab.value)
        return (
          <button
            key={tab.value}
            onClick={() => router.push(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors border',
              isActive
                ? 'bg-background text-foreground shadow-sm border-ring/40'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/60 border-transparent hover:border-ring/20'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}