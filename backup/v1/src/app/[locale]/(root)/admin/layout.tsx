import type {Metadata} from 'next'

import {AdminShell} from '@/components/admin/admin-shell'

import {requireLocalizedAdmin, safeAdminLocale} from './_lib/admin-data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: {follow: false, index: false},
  title: 'Studio administration',
}

interface AdminRootLayoutProps {
  children: React.ReactNode
  params: Promise<{locale: string}>
}

export default async function AdminRootLayout({
  children,
  params,
}: AdminRootLayoutProps) {
  const {locale: requestedLocale} = await params
  const locale = safeAdminLocale(requestedLocale)
  const user = await requireLocalizedAdmin(locale)

  return (
    <AdminShell locale={locale} user={{email: user.email, name: user.name}}>
      {children}
    </AdminShell>
  )
}
