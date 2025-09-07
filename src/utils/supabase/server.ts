import {createServerClient} from '@supabase/ssr'
import {cookies} from 'next/headers'

// Enhanced User type that includes Supabase Auth User + profile
export type EnhancedUser = {
  // Supabase Auth User fields
  id: string
  aud: string
  role?: string
  email?: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  identities?: any[]
  created_at: string
  updated_at?: string
  is_anonymous?: boolean

  // Custom fields
  profile: {
    id: string
    email: string
    name?: string
    image?: string
    role?: string
    phone?: string
    address?: string
    bio?: string
    website?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    github?: string
    created_at?: string
    updated_at?: string
    avatar_url?: string
    socials?: {
      id: string
      user_id: string
      platform: string
      url: string
      created_at: string
      updated_at: string
    }[]
  }
  isAdmin: boolean
}

export interface GetUserOptions {
  includeSocials?: boolean
}

// Type definitions
export interface Social {
  id: string
  platform: string
  url: string
  created_at: string
}

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
            cookiesToSet.forEach(({name, value, options}) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}

// Public function to get Bekten Usubaliev's contact information
// This is safe because it only returns specific public contact fields
export async function getBektenContactInfo() {
  const supabase = await createClient()

  // Get Bekten's user profile by email (public information)
  const {data: profile, error} = await supabase
    .from('users')
    .select(
      `
      name,
      phone,
      address,
      working_hours,
      map_embed_url,
      socials (
        platform,
        url
      )
    `,
    )
    .eq('email', 'bekten.usubaliev@gmail.com') // Bekten's known email
    .eq('role', 'ADMIN') // Additional security: only admin users
    .single()

  if (error || !profile) {
    console.error('Error fetching Bekten contact info:', error)

    return null
  }

  // Return only safe, public contact information
  return {
    name: profile.name,
    phone: profile.phone,
    address: profile.address,
    working_hours: profile.working_hours,
    map_embed_url: profile.map_embed_url,
    socials: profile.socials || [],
  }
}

// Type-safe user session helpers
export async function getUser(
  options: GetUserOptions = {},
): Promise<EnhancedUser | null> {
  const supabase = await createClient()
  const {
    data: {user},
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const {data: profile} = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Fetch socials if requested
  let socials: Social[] = []

  if (options.includeSocials) {
    const {data: socialsData, error: socialsError} = await supabase
      .from('socials')
      .select('*')
      .eq('user_id', user.id)
      .order('platform')

    if (!socialsError && socialsData) {
      socials = socialsData
    }
  }

  return {
    ...user,
    profile: {
      ...profile,
      socials: options.includeSocials ? socials : undefined,
    },
    isAdmin: profile.role?.toLowerCase() === 'admin',
  }
}

export async function requireAdmin() {
  const user = await getUser()

  if (!user || user.profile?.role?.toLowerCase() !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

export async function requireAuth(options: GetUserOptions = {}) {
  const user = await getUser(options)

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

// Usage examples:
// Basic user data: const user = await getUser()
// With socials: const userWithSocials = await getUser({ includeSocials: true })
// Auth required: const user = await requireAuth({ includeSocials: true })
// Public contact: const contactInfo = await getBektenContactInfo()
