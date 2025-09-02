import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Type-safe user session helpers
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    ...user,
    profile: profile || null,
    isAdmin: profile.role.toLowerCase() === 'admin'
  }
}

export async function requireAdmin() {
  const user = await getUser()

  if (!user || user.profile?.role?.toLowerCase() !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}
