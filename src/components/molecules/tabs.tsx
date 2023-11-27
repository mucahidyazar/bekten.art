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
    <div className="mb-4 flex items-center gap-2 rounded-sm border-primary-500 border-opacity-80 bg-primary-500 bg-opacity-20 text-sm">
      {tabs.map(tab => (
        <div
          key={tab.value}
          onClick={() => router.push(tab.value)}
          className={cn(
            'flex-grow cursor-pointer rounded-sm p-3 text-center text-foreground',
            pathname.includes(tab.value) &&
              'bg-primary-500 bg-opacity-20 shadow-sm',
          )}
        >
          {tab.label}
        </div>
      ))}
    </div>
  )
}
