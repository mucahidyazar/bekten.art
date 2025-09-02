import {SignUpForm} from '@/components/forms/sign-up-form'
import {AuthSection} from '@/components/molecules/auth-section'

export default async function SignUpPage() {
  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join Bekten Art community today
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
            Or create account with email
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <SignUpForm />

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Already have an account?{' '}
          <a 
            href="/sign-in" 
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}