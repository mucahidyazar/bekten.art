'use client'

import {useSearchParams} from 'next/navigation'

import {useHydrated} from '@/hooks/use-hydrated'

export function ErrorDisplay() {
  const mounted = useHydrated()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (!mounted || !error) {
    return null
  }

  return (
    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p className="text-sm text-red-600 dark:text-red-400">
        {decodeURIComponent(error)}
      </p>
    </div>
  )
}
