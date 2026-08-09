import {PrismaAdapter} from '@next-auth/prisma-adapter'
import {compare} from 'bcryptjs'
import {getServerSession, type NextAuthOptions} from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

import {prisma} from '@/lib/db'
import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'
import {authorizeCredentials} from '@/server/auth/credentials'
import {
  getClientAddress,
  shouldTrustProxy,
} from '@/server/auth/request-context'
import {safeAuthRedirect} from '@/server/auth/safe-redirect'
import {
  applySessionClaims,
  refreshJwtClaims,
} from '@/server/auth/session-utils'

import type {Provider} from 'next-auth/providers/index'

const LOGIN_POLICY = Object.freeze({
  limit: 10,
  windowMs: 15 * 60 * 1_000,
})

const googleClientId = process.env.AUTH_GOOGLE_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET

export function auth() {
  return getServerSession(authOptions)
}

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: {label: 'Email', type: 'email'},
      password: {label: 'Password', type: 'password'},
    },
    async authorize(credentials, request) {
      const normalizedEmail = String(credentials?.email ?? '')
        .trim()
        .toLowerCase()
        .slice(0, 320)
      const address = getClientAddress(request, shouldTrustProxy())
      const networkLimit = await consumeConfiguredRateLimit({
        action: 'login_ip',
        identifier: address,
        policy: LOGIN_POLICY,
      })

      if (!networkLimit.allowed) {
        return null
      }

      const identityLimit = await consumeConfiguredRateLimit({
        action: 'login_identity',
        identifier: normalizedEmail || 'invalid',
        policy: LOGIN_POLICY,
      })

      if (!identityLimit.allowed) {
        return null
      }

      return authorizeCredentials(credentials, {
        comparePassword: compare,
        findUserByEmail: email =>
          prisma.user.findUnique({
            select: {
              email: true,
              emailVerified: true,
              id: true,
              image: true,
              name: true,
              passwordHash: true,
              passwordResetRequired: true,
              role: true,
              sessionVersion: true,
            },
            where: {email},
          }),
      })
    },
  }),
  ...(googleClientId && googleClientSecret
    ? [
        Google({
          authorization: {
            params: {
              prompt: 'select_account',
              response_type: 'code',
              scope: 'openid email profile',
            },
          },
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      ]
    : []),
]

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({token, user}) {
      return refreshJwtClaims(token, user, userId =>
        prisma.user.findUnique({
          select: {
            id: true,
            passwordResetRequired: true,
            role: true,
            sessionVersion: true,
          },
          where: {id: userId},
        }),
      )
    },
    async redirect({baseUrl, url}) {
      return safeAuthRedirect(url, baseUrl, '/en')
    },
    async session({session, token}) {
      return applySessionClaims(session, token)
    },
    async signIn({account, profile}) {
      if (account?.provider !== 'google') {
        return true
      }

      const googleProfile = profile as
        | {email?: unknown; email_verified?: unknown}
        | undefined

      return Boolean(
        googleProfile?.email_verified === true &&
          typeof googleProfile.email === 'string' &&
          googleProfile.email.length <= 320,
      )
    },
  },
  events: {
    async signIn({account, user}) {
      if (!user.id) {
        return
      }

      await Promise.all([
        prisma.user.updateMany({
          data: {last_sign_in_at: new Date()},
          where: {id: user.id},
        }),
        ...(account?.provider === 'google'
          ? [
              prisma.account.updateMany({
                data: {
                  access_token: null,
                  expires_at: null,
                  id_token: null,
                  refresh_token: null,
                  session_state: null,
                  token_type: null,
                },
                where: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              }),
            ]
          : []),
      ])
    },
  },
  pages: {
    error: '/en/sign-in',
    signIn: '/en/sign-in',
  },
  providers,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    maxAge: 12 * 60 * 60,
    strategy: 'jwt',
    updateAge: 60 * 60,
  },
}

export const googleAuthEnabled = Boolean(
  googleClientId && googleClientSecret,
)
