import {getTranslations} from 'next-intl/server'

import {PasswordResetSubmitForm} from '@/components/forms/password-reset-forms'

import type {AppLocale} from '@/lib/localized-path'

export default async function ResetPasswordPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{locale: AppLocale}>
  searchParams: Promise<{token?: string | string[]}>
}>) {
  const [{locale}, query] = await Promise.all([params, searchParams])
  const t = await getTranslations({locale, namespace: 'passwordReset'})
  const token = Array.isArray(query.token) ? query.token[0] : query.token

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('resetTitle')}</h1>
        <p className="text-muted-foreground text-sm">{t('resetSubtitle')}</p>
      </div>
      <PasswordResetSubmitForm locale={locale} token={token ?? ''} />
    </div>
  )
}
