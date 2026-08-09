'use server'

import {redirect} from 'next/navigation'

import {
  requireAdminUser,
  requireAuthenticatedUser,
} from '@/server/auth/access'

export async function requireAdmin() {
  try {
    return await requireAdminUser()
  } catch {
    redirect('/en')
  }
}

export async function requireAuth() {
  try {
    return await requireAuthenticatedUser()
  } catch {
    redirect('/en/sign-in')
  }
}

// NextAuth v4 intentionally exposes OAuth initiation through its HTTP flow.
// Client components should prefer next-auth/react's signIn for a one-click UI.
export async function signInWithGoogle() {
  redirect('/api/auth/signin/google?callbackUrl=%2Fen')
}

export async function signOutUser() {
  redirect('/api/auth/signout?callbackUrl=%2Fen')
}
