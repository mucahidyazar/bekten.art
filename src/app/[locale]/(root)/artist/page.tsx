import {permanentRedirect} from 'next/navigation'

import {localizedPath} from '@/lib/localized-path'

import type {AppLocale} from '@/lib/localized-path'

type PageProps = Readonly<{params: Promise<{locale: AppLocale}>}>

export default async function LegacyArtistPage({params}: PageProps) {
  const {locale} = await params

  permanentRedirect(localizedPath(locale, '/about'))
}
