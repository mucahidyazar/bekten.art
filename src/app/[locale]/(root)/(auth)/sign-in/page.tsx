import { Suspense } from 'react'

import {SignInForm} from '@/components/forms/sign-in-form'
import {AuthSection} from '@/components/molecules/auth-section'
import { ErrorDisplay } from '@/components/molecules/ErrorDisplay'

export default async function SignInPage() {
  return (
    <div className="w-full space-y-4">
      {/* Error Message */}
      <Suspense fallback={null}>
        <ErrorDisplay />
      </Suspense>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome Back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
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
            Or continue with email
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <SignInForm />

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Don&apos;t have an account?{' '}
          <a 
            href="/sign-up" 
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}