import {getTranslations} from 'next-intl/server'

import {SignUpForm} from '@/components/forms/sign-up-form'
import {AuthSection} from '@/components/molecules/auth-section'

export default async function SignUpPage() {
  const t = await getTranslations('auth.signUp')

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          {t('auth.signUp.title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('auth.signUp.subtitle')}
        </p>
      </div>

      {/* Google Sign Up */}
      <AuthSection />

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="border-muted/50 w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-3 py-1 font-medium">
            {t('auth.signUp.orContinue')}
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <SignUpForm />

      {/* Footer */}
      <div className="text-muted-foreground text-center text-sm">
        <p>
          {t('auth.signUp.hasAccount')}{' '}
          <a
            href="/sign-in"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t('auth.signUp.signIn')}
          </a>
        </p>
      </div>
    </div>
  )
}
