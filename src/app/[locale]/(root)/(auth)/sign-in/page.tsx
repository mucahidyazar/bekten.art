import {getTranslations} from 'next-intl/server'
import { Suspense } from 'react'

import {SignInForm} from '@/components/forms/sign-in-form'
import {AuthSection} from '@/components/molecules/auth-section'
import { ErrorDisplay } from '@/components/molecules/ErrorDisplay'

export default async function SignInPage() {
  const t = await getTranslations('auth.signIn')
  
  return (
    <div className="w-full space-y-4">
      {/* Error Message */}
      <Suspense fallback={null}>
        <ErrorDisplay />
      </Suspense>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('auth.signIn.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('auth.signIn.subtitle')}
        </p>
      </div>

      {/* Google Sign In */}
      <AuthSection />

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 py-1 text-muted-foreground font-medium">
            {t('auth.signIn.orContinue')}
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <SignInForm />

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {t('auth.signIn.noAccount')}{' '}
          <a 
            href="/sign-up" 
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t('auth.signIn.signUp')}
          </a>
        </p>
      </div>
    </div>
  )
}