'use client'

import { useSearchParams } from 'next/navigation'

import { useEffect, useState } from 'react'

export function ErrorDisplay() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setError(searchParams.get('error'))
  }, [searchParams])

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
