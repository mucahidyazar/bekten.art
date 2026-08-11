import {PrismaAdapter} from '@next-auth/prisma-adapter'
import {getServerSession, type NextAuthOptions} from 'next-auth'

import {prisma} from '@/lib/db'
import {getRequiredAuthSecret} from '@/server/auth/request-context'
import {safeAuthRedirect} from '@/server/auth/safe-redirect'
import {createStudioAdapter} from '@/server/studio-auth/adapter'
import {getConfiguredStudioMagicLink} from '@/server/studio-auth/configured-magic-link'
import {createStudioEmailProvider} from '@/server/studio-auth/email-provider'
import {isStudioEditorRole} from '@/server/studio-auth/roles'

let cachedAuthOptions: NextAuthOptions | undefined

export function auth() {
  return getServerSession(getAuthOptions())
}

export function getAuthOptions(): NextAuthOptions {
  if (cachedAuthOptions) return cachedAuthOptions

  const secret = getRequiredAuthSecret()
  const canonicalUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()
  const secureCookies =
    process.env.NODE_ENV === 'production' ||
    Boolean(canonicalUrl?.startsWith('https://'))
  const configuredStudioMagicLink = getConfiguredStudioMagicLink()
  const adapter = createStudioAdapter(
    PrismaAdapter(prisma),
    configuredStudioMagicLink,
  )

  cachedAuthOptions = {
  adapter,
  callbacks: {
    async redirect({baseUrl, url}) {
      return safeAuthRedirect(url, baseUrl, '/studio')
    },
    async session({session, user}) {
      const role = (user as {role?: string}).role

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role,
        },
      } as typeof session
    },
    async signIn({email, user}) {
      if (email?.verificationRequest) return true

      return isStudioEditorRole((user as {role?: unknown}).role)
    },
  },
  cookies: {
    sessionToken: {
      name: secureCookies
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: secureCookies,
      },
    },
  },
  events: {
    async signIn({isNewUser, user}) {
      await prisma.auditEvent.create({
        data: {
          action: 'studio.sign-in.completed',
          actorUserId: user.id,
          entityType: 'StudioSession',
          metadata: {isNewUser: Boolean(isNewUser)},
        },
      })
    },
    async signOut({session}) {
      const userId = (session as {userId?: string} | undefined)?.userId

      await prisma.auditEvent.create({
        data: {
          action: 'studio.sign-out.completed',
          actorUserId: userId ?? null,
          entityType: 'StudioSession',
          metadata: {},
        },
      })
    },
  },
  pages: {
    error: '/studio/sign-in',
    signIn: '/studio/sign-in',
  },
  providers: [
    createStudioEmailProvider({
      from: process.env.RESEND_FROM_EMAIL?.trim() || 'Bekten Studio',
      maxAge: 10 * 60,
      normalizeIdentifier: identifier =>
        configuredStudioMagicLink.normalizeIdentifier(identifier),
      secret,
      sendVerificationRequest: ({expires, identifier, token, url}) =>
        configuredStudioMagicLink.queueMail({
          expires,
          identifier,
          token,
          url,
        }),
    }),
  ],
  secret,
  session: {
    maxAge: 8 * 60 * 60,
    strategy: 'database',
    updateAge: 30 * 60,
  },
  }

  return cachedAuthOptions
}
