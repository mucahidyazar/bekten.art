import NextAuth from 'next-auth'

import {authOptions} from '@/auth'
import {guardConfiguredStudioMagicLinkRequest} from '@/server/studio-auth/configured-request-boundary'

const handler = NextAuth(authOptions)

export const GET = handler

export async function POST(request: Request) {
  if (new URL(request.url).pathname === '/api/auth/signin/email') {
    const boundary = await guardConfiguredStudioMagicLinkRequest(request)

    if (!boundary.allowed) return boundary.response
  }

  return handler(request)
}

export const dynamic = 'force-dynamic'
