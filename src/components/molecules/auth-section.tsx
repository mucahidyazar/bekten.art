import {getTranslations} from 'next-intl/server'

import {signInWithGoogle} from '@/lib/auth-actions'
import {getUser} from '@/utils/supabase/server'

export async function AuthSection() {
  const user = await getUser()
  const t = await getTranslations('auth.signIn')

  if (user) {
    return (
      <div className="flex items-center space-x-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Successfully signed in
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {user.email}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="border-ring/30 hover:border-primary bg-background hover:bg-muted/30 group flex h-10 w-full items-center justify-center space-x-3 rounded-md border-2 px-4 transition-all duration-200"
        >
          <div className="h-5 w-5 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500" />
          <span className="text-foreground group-hover:text-primary font-medium transition-colors">
            {t('googleButton')}
          </span>
        </button>
      </form>
    </div>
  )
}
