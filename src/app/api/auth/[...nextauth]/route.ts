import type {NextRequest} from 'next/server'

import NextAuth from 'next-auth'

import {getAuthOptions} from '@/auth'
import {guardConfiguredStudioMagicLinkRequest} from '@/server/studio-auth/configured-request-boundary'

type NextAuthRouteContext = Readonly<{
  params: Promise<{nextauth: string[]}>
}>

type NextAuthAppRouteHandler = (
  request: NextRequest,
  context: NextAuthRouteContext,
) => Promise<Response>

function handleAuthRequest(request: Request, context: NextAuthRouteContext) {
  const handler = NextAuth(getAuthOptions()) as NextAuthAppRouteHandler

  return handler(request as NextRequest, context)
}

export const GET = handleAuthRequest

export async function POST(request: Request, context: NextAuthRouteContext) {
  if (new URL(request.url).pathname === '/api/auth/signin/email') {
    const boundary = await guardConfiguredStudioMagicLinkRequest(request)

    if (!boundary.allowed) return boundary.response
  }

  return handleAuthRequest(request, context)
}

export const dynamic = 'force-dynamic'
