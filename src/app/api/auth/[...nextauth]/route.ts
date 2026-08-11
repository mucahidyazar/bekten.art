import NextAuth from 'next-auth'

import {getAuthOptions} from '@/auth'
import {guardConfiguredStudioMagicLinkRequest} from '@/server/studio-auth/configured-request-boundary'

function handleAuthRequest(request: Request) {
  return NextAuth(getAuthOptions())(request)
}

export const GET = handleAuthRequest

export async function POST(request: Request) {
  if (new URL(request.url).pathname === '/api/auth/signin/email') {
    const boundary = await guardConfiguredStudioMagicLinkRequest(request)

    if (!boundary.allowed) return boundary.response
  }

  return handleAuthRequest(request)
}

export const dynamic = 'force-dynamic'
