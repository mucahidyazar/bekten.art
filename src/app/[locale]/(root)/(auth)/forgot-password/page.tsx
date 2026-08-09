import {getTranslations} from 'next-intl/server'

import {PasswordResetRequestForm} from '@/components/forms/password-reset-forms'

import type {AppLocale} from '@/lib/localized-path'

export default async function ForgotPasswordPage({
  params,
}: Readonly<{params: Promise<{locale: AppLocale}>}>) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'passwordReset'})

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('requestTitle')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('requestSubtitle')}</p>
      </div>
      <PasswordResetRequestForm locale={locale} />
    </div>
  )
}
