import { signInWithGoogle } from '@/lib/auth-actions'
import { getUser } from '@/utils/supabase/server'

export async function AuthSection() {
  const user = await getUser()

  if (user) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
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
          className="w-full h-10 px-4 border-2 border-ring/30 hover:border-primary bg-background hover:bg-muted/30 rounded-md transition-all duration-200 group flex items-center justify-center space-x-3"
        >
          <div className="w-5 h-5 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 rounded-full flex-shrink-0" />
          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
            Continue with Google
          </span>
        </button>
      </form>
    </div>
  )
}
