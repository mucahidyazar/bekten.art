import {PrismaAdapter} from '@auth/prisma-adapter'
import {compare} from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

import {prisma} from '@/lib/db'

const providers: any[] = [
  Credentials({
    credentials: {
      email: {label: 'Email', type: 'email'},
      password: {label: 'Password', type: 'password'},
    },
    authorize: async credentials => {
      const email = String(credentials?.email ?? '').trim().toLowerCase()
      const password = String(credentials?.password ?? '')

      if (!email || !password) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: {email},
      })

      if (!user?.passwordHash) {
        return null
      }

      const isValidPassword = await compare(password, user.passwordHash)

      if (!isValidPassword) {
        return null
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        passwordResetRequired: user.passwordResetRequired,
      }
    },
  }),
]

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  )
}

export const {handlers, auth, signIn, signOut} = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/sign-in',
  },
  providers,
  callbacks: {
    session: async ({session, user}) => {
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user.role as 'USER' | 'ARTIST' | 'ADMIN') ?? 'USER'
      }

      return session
    },
  },
  events: {
    signIn: async message => {
      if (message.user?.id) {
        await prisma.user.update({
          where: {id: message.user.id},
          data: {
            last_sign_in_at: new Date(),
            passwordResetRequired: false,
          },
        })
      }
    },
  },
  trustHost: true,
})
