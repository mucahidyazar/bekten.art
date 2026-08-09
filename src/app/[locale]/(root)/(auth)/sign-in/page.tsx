import Link from 'next/link'

import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'

import {SignInForm} from '@/components/forms/sign-in-form'
import {AuthSection} from '@/components/molecules/auth-section'
import {ErrorDisplay} from '@/components/molecules/error-display'
import {localizedPath} from '@/lib/localized-path'

import type {AppLocale} from '@/lib/localized-path'

export default async function SignInPage({
  params,
}: Readonly<{params: Promise<{locale: AppLocale}>}>) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'auth.signIn'})

  return (
    <div className="w-full space-y-4">
      {/* Error Message */}
      <Suspense fallback={null}>
        <ErrorDisplay />
      </Suspense>

      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      {/* Google Sign In */}
      <AuthSection />

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="border-muted/50 w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-3 py-1 font-medium">
            {t('orContinue')}
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <SignInForm />

      <div className="text-center">
        <Link
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          href={localizedPath(locale, '/forgot-password')}
        >
          {t('forgotPassword')}
        </Link>
      </div>

      {/* Footer */}
      <div className="text-muted-foreground text-center text-sm">
        <p>
          {t('noAccount')}{' '}
          <Link
            href={localizedPath(locale, '/sign-up')}
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t('signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
