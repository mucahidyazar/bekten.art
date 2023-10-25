import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import Providers from "next-auth/providers/credentials"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

// import { Client } from "postmark"

import { env } from "@/configs/env.mjs"
import { db } from "@/lib/db"


import { authorize } from "./authorize"

// const postmarkClient = new Client(env.POSTMARK_API_TOKEN)
export const adapter = PrismaAdapter(db);

export const authOptions: NextAuthOptions = {
  // huh any! I know.
  // This is a temporary fix for prisma client.
  // @see https://github.com/prisma/prisma/issues/16117
  adapter,
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Providers({ // this!
      id: "googleonetap", // We will use this id later to specify for what Provider we want to trigger the signIn method
      name: "google-one-tap",

      // This means that the authentication will be done through a single credential called 'credential'
      credentials: {
        credential: { type: "text" },
      },
      // This function will be called upon signIn
      authorize
    }),
  ],
  pages: {
    signIn: '/sign-in'
  },
  callbacks: {
    async session({ token, session }) {

      let userData;
      if (token && session.user) {
        userData = {
          id: token.id as string,
          name: token.name ?? null,
          email: token.email ?? null,
          image: token.image as string ?? null,
          isAdmin: token.isAdmin as boolean,
        }

        session.user = userData
      }

      const mySession = {
        ...session,
        user: {
          ...session.user,
          ...userData
        },
      }

      return mySession
    },
    async jwt({ token, user }) {
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email,
        },
      })

      if (!dbUser) {
        if (user) {
          token.id = user?.id
        }
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image,
        isAdmin: dbUser.isAdmin,
      }
    },
    async redirect({ baseUrl }) { return baseUrl },
  },
}
