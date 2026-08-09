import {redirect} from 'next/navigation'

import {safeAdminLocale} from '../_lib/admin-data'

export default async function LegacyAdminAnalyticsPage({
  params,
}: Readonly<{params: Promise<{locale: string}>}>) {
  const {locale} = await params

  redirect(`/${safeAdminLocale(locale)}/admin/overview`)
}
