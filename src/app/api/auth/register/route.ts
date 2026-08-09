import {NextResponse} from 'next/server'

import {getConfiguredEmailVerificationService} from '@/server/auth/configured-email-verification'
import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {
  getClientAddress,
  shouldTrustProxy,
} from '@/server/auth/request-context'
import {
  InvalidRequestBodyError,
  readBoundedText,
  RequestBodyTooLargeError,
} from '@/server/http/bounded-body'

const REGISTER_POLICY = Object.freeze({
  limit: 5,
  windowMs: 60 * 60 * 1_000,
})
const MAX_REQUEST_BYTES = 16 * 1_024
const acceptedPayload = Object.freeze({
  message:
    'If the address can be registered, a verification email has been sent.',
  success: true,
})

function getAppUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()

  if (!configured) {
    throw new Error('Application URL is not configured')
  }

  return new URL(configured).origin
}

function json(payload: unknown, status: number, headers?: HeadersInit) {
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'private, no-store',
      ...headers,
    },
    status,
  })
}

export async function POST(request: Request) {
  try {
    const appUrl = getAppUrl()

    if (!isSameOriginMutation(request, appUrl)) {
      return json({error: 'Request origin is not allowed', success: false}, 403)
    }

    const contentType = request.headers.get('content-type') ?? ''
    const contentLength = Number(request.headers.get('content-length') ?? '0')

    if (
      !contentType.toLowerCase().startsWith('application/json') ||
      !Number.isFinite(contentLength) ||
      contentLength > MAX_REQUEST_BYTES
    ) {
      return json({error: 'Invalid registration request', success: false}, 400)
    }

    let rawBody: string

    try {
      rawBody = await readBoundedText(request, MAX_REQUEST_BYTES)
    } catch (error) {
      if (
        error instanceof InvalidRequestBodyError ||
        error instanceof RequestBodyTooLargeError
      ) {
        return json(
          {error: 'Invalid registration request', success: false},
          400,
        )
      }

      throw error
    }

    if (!rawBody) {
      return json({error: 'Invalid registration request', success: false}, 400)
    }

    let parsedBody: unknown

    try {
      parsedBody = JSON.parse(rawBody)
    } catch {
      return json({error: 'Invalid registration request', success: false}, 400)
    }

    if (
      !parsedBody ||
      typeof parsedBody !== 'object' ||
      Array.isArray(parsedBody)
    ) {
      return json({error: 'Invalid registration request', success: false}, 400)
    }

    const body = parsedBody as Record<string, unknown>

    const normalizedEmail = String(body.email ?? '')
      .trim()
      .toLowerCase()
      .slice(0, 320)
    const address = getClientAddress(request, shouldTrustProxy())
    const networkLimit = await consumeConfiguredRateLimit({
      action: 'register_ip',
      identifier: address,
      policy: REGISTER_POLICY,
    })

    if (!networkLimit.allowed) {
      return json(
        {error: 'Too many requests. Please try again later.', success: false},
        429,
        {'Retry-After': String(networkLimit.retryAfterSeconds)},
      )
    }

    const identityLimit = await consumeConfiguredRateLimit({
      action: 'register_identity',
      identifier: normalizedEmail || 'invalid',
      policy: REGISTER_POLICY,
    })

    if (!identityLimit.allowed) {
      return json(
        {error: 'Too many requests. Please try again later.', success: false},
        429,
        {'Retry-After': String(identityLimit.retryAfterSeconds)},
      )
    }

    try {
      await getConfiguredEmailVerificationService().register(body, appUrl)
    } catch (error) {
      if (error instanceof Error && error.message === 'REGISTRATION_INPUT_INVALID') {
        return json({error: 'Invalid registration request', success: false}, 400)
      }

      if (error instanceof Error && error.message === 'EMAIL_DELIVERY_FAILED') {
        // The account remains unverified and the hashed token remains valid, so
        // the same generic response prevents account-enumeration side channels.
        console.error('Email verification delivery is temporarily unavailable')

        return json(acceptedPayload, 202)
      }

      throw error
    }

    return json(acceptedPayload, 202)
  } catch {
    console.error('Registration request failed')

    return json({error: 'Unable to process registration', success: false}, 500)
  }
}

export const dynamic = 'force-dynamic'
