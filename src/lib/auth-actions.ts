'use server'

import { redirect } from 'next/navigation'

import { createClient, requireAuth as requireAuthBase, requireAdmin as requireAdminBase } from '@/utils/supabase/server'

export async function requireAdmin() {
  try {
    const userProfile = await requireAdminBase()
    return userProfile
  } catch (error) {
    redirect('/')
  }
}

export async function requireAuth() {
  try {
    const user = await requireAuthBase()
    return user
  } catch (error) {
    redirect('/sign-in')
  }
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })

  if (error) {
    console.error('Google sign in error:', error)
    throw new Error('Authentication failed')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
