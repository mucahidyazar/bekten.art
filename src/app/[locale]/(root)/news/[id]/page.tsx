import {permanentRedirect} from 'next/navigation'

import {localizedPath} from '@/lib/localized-path'

import type {AppLocale} from '@/lib/localized-path'

type PageProps = Readonly<{
  params: Promise<{id: string; locale: AppLocale}>
}>

export default async function LegacyNewsDetailPage({params}: PageProps) {
  const {id, locale} = await params

  permanentRedirect(
    localizedPath(locale, `/journal/${encodeURIComponent(id)}`),
  )
}
