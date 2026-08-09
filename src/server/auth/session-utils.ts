import {safeRedirectPath} from './safe-redirect'

import type {Session, User} from 'next-auth'
import type {JWT} from 'next-auth/jwt'

export type AppUserRole = 'USER' | 'ARTIST' | 'ADMIN'

type SessionUserClaims = Readonly<{
  id?: string | null
  passwordResetRequired?: boolean | null
  role?: string | null
  sessionVersion?: number | null
}>

const DEFAULT_ROLE: AppUserRole = 'USER'

export function applySessionClaims(session: Session, token: JWT): Session {
  if (!session.user) {
    return session
  }

  return {
    ...session,
    user: {
      ...session.user,
      authenticatedAt:
        typeof token.authTime === 'number' ? token.authTime : undefined,
      id: token.sub || '',
      passwordResetRequired: Boolean(token.passwordResetRequired),
      role: normalizeUserRole(
        typeof token.role === 'string' ? token.role : undefined,
      ),
    },
  }
}

export function enrichJwtClaims(token: JWT, user?: SessionUserClaims | User): JWT {
  if (!user) {
    return token
  }

  return {
    ...token,
    authTime:
      typeof token.authTime === 'number'
        ? token.authTime
        : typeof token.iat === 'number'
          ? token.iat
          : Math.floor(Date.now() / 1_000),
    passwordResetRequired: Boolean(user.passwordResetRequired),
    role: normalizeUserRole(user.role),
    sessionVersion:
      typeof user.sessionVersion === 'number' ? user.sessionVersion : undefined,
    sub: user.id ?? token.sub,
  }
}

function invalidatedJwt(token: JWT): JWT {
  return {
    ...token,
    authTime: undefined,
    email: undefined,
    name: undefined,
    passwordResetRequired: false,
    picture: undefined,
    role: DEFAULT_ROLE,
    sessionVersion: undefined,
    sub: undefined,
  }
}

export function normalizeUserRole(role?: string | null): AppUserRole {
  if (role === 'ARTIST' || role === 'ADMIN' || role === 'USER') {
    return role
  }

  return DEFAULT_ROLE
}

export async function refreshJwtClaims(
  token: JWT,
  signedInUser: SessionUserClaims | User | undefined,
  findCurrentClaims: (
    userId: string,
  ) => Promise<SessionUserClaims | null | undefined>,
) {
  if (signedInUser) {
    return enrichJwtClaims(token, signedInUser)
  }

  if (!token.sub) {
    return token
  }

  const currentClaims = await findCurrentClaims(token.sub)

  if (!currentClaims) {
    return invalidatedJwt(token)
  }

  if (
    typeof token.sessionVersion !== 'number' ||
    typeof currentClaims.sessionVersion !== 'number' ||
    token.sessionVersion !== currentClaims.sessionVersion
  ) {
    return invalidatedJwt(token)
  }

  return enrichJwtClaims(token, currentClaims)
}

export function sanitizeRedirectPath(redirect: string | null | undefined) {
  return safeRedirectPath(redirect, '/')
}
