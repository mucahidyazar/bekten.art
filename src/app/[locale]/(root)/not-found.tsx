'use client'

import Link from 'next/link'

import {useLocale} from 'next-intl'

import {publicLocale} from '@/components/public-site/public-copy'
import {localizedPath} from '@/lib/localized-path'

export default function NotFound() {
  const locale = publicLocale(useLocale())

  return (
    <div className="text-foreground mt-[30%] flex h-full flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-7xl">404</h1>
      <p className="mb-2">
        You didn't break the internet, but we can't find what you're looking
        for.
      </p>
      <Link href={localizedPath(locale, '/')} className="text-primary-500">
        Return Home
      </Link>
    </div>
  )
}
