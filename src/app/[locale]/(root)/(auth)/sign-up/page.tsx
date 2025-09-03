import {getTranslations} from 'next-intl/server'

import {SignUpForm} from '@/components/forms/sign-up-form'
import {AuthSection} from '@/components/molecules/auth-section'

export default async function SignUpPage() {
  const t = await getTranslations('auth.signUp')
  
  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('auth.signUp.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('auth.signUp.subtitle')}
        </p>
      </div>

      {/* Google Sign Up */}
      <AuthSection />

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 py-1 text-muted-foreground font-medium">
            {t('auth.signUp.orContinue')}
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <SignUpForm />

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {t('auth.signUp.hasAccount')}{' '}
          <a 
            href="/sign-in" 
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t('auth.signUp.signIn')}
          </a>
        </p>
      </div>
    </div>
  )
}