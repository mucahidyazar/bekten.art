'use server'

import {redirect} from 'next/navigation'

import {signIn, signOut} from '@/auth'
import {
  requireAdmin as requireAdminBase,
  requireAuth as requireAuthBase,
} from '@/utils/supabase/server'

export async function requireAdmin() {
  try {
    return await requireAdminBase()
  } catch {
    redirect('/')
  }
}

export async function requireAuth() {
  try {
    return await requireAuthBase()
  } catch {
    redirect('/sign-in')
  }
}

export async function signInWithGoogle() {
  await signIn('google', {
    redirectTo: '/',
  })
}

export async function signOutUser() {
  await signOut({
    redirectTo: '/',
  })
}
