import Link from 'next/link'

import {localizedPath} from '@/lib/localized-path'

import type {AppLocale} from '@/lib/localized-path'

export default async function NotFound({
  params,
}: Readonly<{params: Promise<{locale: AppLocale}>}>) {
  const {locale} = await params

  return (
    <div className="mt-[30%] flex h-full flex-col items-center justify-center text-center text-foreground">
      <h2 className="mb-4 text-7xl">404</h2>
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
