import {PrismaAdapter} from '@next-auth/prisma-adapter'
import {getServerSession, type NextAuthOptions} from 'next-auth'

import {prisma} from '@/lib/db'
import {safeAuthRedirect} from '@/server/auth/safe-redirect'
import {applySessionClaims, refreshJwtClaims} from '@/server/auth/session-utils'

export function auth() {
  return getServerSession(authOptions)
}

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
  },
  pages: {
    error: '/studio/sign-in',
    signIn: '/studio/sign-in',
  },
  providers: [],
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    maxAge: 12 * 60 * 60,
    strategy: 'jwt',
    updateAge: 60 * 60,
  },
}
