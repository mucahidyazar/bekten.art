import {getTranslations} from 'next-intl/server'
import {Suspense} from 'react'

import {SignInForm} from '@/components/forms/sign-in-form'
import {AuthSection} from '@/components/molecules/auth-section'
import {ErrorDisplay} from '@/components/molecules/error-display'

export default async function SignInPage() {
  const t = await getTranslations('auth.signIn')

  return (
    <div className="w-full space-y-4">
      {/* Error Message */}
      <Suspense fallback={null}>
        <ErrorDisplay />
      </Suspense>

      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          {t('auth.signIn.title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('auth.signIn.subtitle')}
        </p>
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
            {t('auth.signIn.orContinue')}
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <SignInForm />

      {/* Footer */}
      <div className="text-muted-foreground text-center text-sm">
        <p>
          {t('auth.signIn.noAccount')}{' '}
          <a
            href="/sign-up"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t('auth.signIn.signUp')}
          </a>
        </p>
      </div>
    </div>
  )
}
