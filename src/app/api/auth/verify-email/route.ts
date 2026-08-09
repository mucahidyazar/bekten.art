import {NextResponse} from 'next/server'

import {getConfiguredEmailVerificationService} from '@/server/auth/configured-email-verification'
import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {getClientAddress, shouldTrustProxy} from '@/server/auth/request-context'

const COOKIE_NAME = 'bekten_email_verification'
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u
const VERIFY_POLICY = Object.freeze({limit: 30, windowMs: 15 * 60 * 1_000})

function appOrigin(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()

  return new URL(configured || request.url).origin
}

function redirect(request: Request, path: string) {
  const response = NextResponse.redirect(new URL(path, appOrigin(request)), 303)

  response.headers.set('Cache-Control', 'private, no-store')

  return response
}

function cookie(request: Request, name: string) {
  const raw = request.headers.get('cookie') ?? ''

  return raw
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

function clearCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/api/auth/verify-email',
    sameSite: 'strict',
    secure: true,
  })
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? ''

  if (!TOKEN_PATTERN.test(token)) {
    return redirect(request, '/en/sign-in?error=verification')
  }

  const response = redirect(
    request,
    '/en/confirm-email-action?action=verify-email',
  )

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: '/api/auth/verify-email',
    sameSite: 'strict',
    secure: true,
  })

  return response
}

export async function POST(request: Request) {
  try {
    const origin = appOrigin(request)

    if (!isSameOriginMutation(request, origin)) {
      return new NextResponse(null, {
        headers: {'Cache-Control': 'private, no-store'},
        status: 403,
      })
    }

    const limit = await consumeConfiguredRateLimit({
      action: 'verify_email_ip',
      identifier: getClientAddress(request, shouldTrustProxy()),
      policy: VERIFY_POLICY,
    })

    if (!limit.allowed) {
      return new NextResponse(null, {
        headers: {
          'Cache-Control': 'private, no-store',
          'Retry-After': String(limit.retryAfterSeconds),
        },
        status: 429,
      })
    }

    const token = cookie(request, COOKIE_NAME)

    if (!token || !TOKEN_PATTERN.test(token)) {
      const response = redirect(request, '/en/sign-in?error=verification')

      clearCookie(response)

      return response
    }

    await getConfiguredEmailVerificationService().verify(token)
    const response = redirect(request, '/en/sign-in?verified=true')

    clearCookie(response)

    return response
  } catch {
    console.error('Email verification request failed')
    const response = redirect(request, '/en/sign-in?error=verification')

    clearCookie(response)

    return response
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
