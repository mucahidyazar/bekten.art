import {PrismaAdapter} from '@next-auth/prisma-adapter'
import {getServerSession, type NextAuthOptions} from 'next-auth'

import {prisma} from '@/lib/db'
import {getRequiredAuthSecret} from '@/server/auth/request-context'
import {safeAuthRedirect} from '@/server/auth/safe-redirect'
import {createStudioAdapter} from '@/server/studio-auth/adapter'
import {getConfiguredStudioMagicLink} from '@/server/studio-auth/configured-magic-link'
import {createStudioEmailProvider} from '@/server/studio-auth/email-provider'
import {
  isStudioAccountSigninAllowed,
  isStudioEditorRole,
} from '@/server/studio-auth/roles'

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
        return safeAuthRedirect(url, baseUrl, '/dashboard')
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

        const studioUser = user as {
          role?: unknown
          studioStatus?: unknown
        }

        return (
          isStudioEditorRole(studioUser.role) &&
          isStudioAccountSigninAllowed(studioUser.studioStatus)
        )
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
        const signedInAt = new Date()

        await prisma.$transaction(async transaction => {
          await transaction.user.updateMany({
            data: {
              acceptedAt: signedInAt,
              studioStatus: 'ACTIVE',
              suspendedAt: null,
            },
            where: {
              id: user.id,
              role: {in: ['EDITOR', 'OWNER', 'ADMIN']},
              studioStatus: 'INVITED',
            },
          })
          await transaction.user.updateMany({
            data: {last_sign_in_at: signedInAt},
            where: {
              id: user.id,
              role: {in: ['EDITOR', 'OWNER', 'ADMIN']},
              studioStatus: 'ACTIVE',
            },
          })
          await transaction.auditEvent.create({
            data: {
              action: 'studio.sign-in.completed',
              actorUserId: user.id,
              entityType: 'StudioSession',
              metadata: {isNewUser: Boolean(isNewUser)},
            },
          })
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
      error: '/dashboard/sign-in',
      signIn: '/dashboard/sign-in',
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
