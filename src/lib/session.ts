import { cookies } from 'next/headers'

import { getIronSession, IronSession } from 'iron-session'

import type { SessionOptions } from 'iron-session'

export interface SessionData {
  userId?: string
  email?: string
  name?: string
  avatar?: string
  role?: string
  isLoggedIn?: boolean
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()

  return await getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function getSessionData(): Promise<SessionData> {
  const session = await getSession()

  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    avatar: session.avatar,
    role: session.role,
    isLoggedIn: !!session.userId,
  }
}

export const sessionOptions: SessionOptions = {
  cookieName: 'bekten_session',
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
}
