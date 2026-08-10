import {redirect} from 'next/navigation'

import {prisma} from '@/lib/db'
import {APP_LOCALES, type AppLocale} from '@/lib/localized-path'
import {createAdminService} from '@/server/admin/admin-service'
import {
  createDatabaseAdminRepository,
  type AdminDatabase,
} from '@/server/admin/database-admin-repository'
import {
  AdminAccessRequiredError,
  AuthenticationRequiredError,
  requireAdminUser,
} from '@/server/auth/access'

export function getAdminService(locale: string) {
  return createAdminService({
    environment: process.env,
    repository: createDatabaseAdminRepository(
      prisma as unknown as AdminDatabase,
    ),
    async requireCapability() {
      const user = await requireLocalizedAdmin(locale)

      return Object.freeze({
        email: user.email,
        id: user.id,
        name: user.name,
        role: 'ADMIN' as const,
      })
    },
  })
}

export async function requireLocalizedAdmin(locale: string) {
  const safeLocale = safeAdminLocale(locale)

  try {
    return await requireAdminUser()
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      const callbackUrl = encodeURIComponent(`/${safeLocale}/admin/overview`)

      redirect(`/${safeLocale}/sign-in?callbackUrl=${callbackUrl}`)
    }

    if (error instanceof AdminAccessRequiredError) redirect(`/${safeLocale}`)

    throw error
  }
}

export function safeAdminLocale(locale: string) {
  return APP_LOCALES.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : 'en'
}
