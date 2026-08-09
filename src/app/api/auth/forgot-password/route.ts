import {getConfiguredPasswordResetService} from '@/server/auth/configured-password-reset'
import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {getClientAddress, shouldTrustProxy} from '@/server/auth/request-context'
import {
  getPublicAppOrigin,
  PublicApiInputError,
  publicJson,
  readPublicJson,
} from '@/server/email/public-api'

const REQUEST_POLICY = Object.freeze({limit: 3, windowMs: 60 * 60 * 1_000})
const acceptedPayload = Object.freeze({
  message: 'If the account is eligible, a reset email has been sent.',
  success: true,
})

export async function POST(request: Request) {
  try {
    const appOrigin = getPublicAppOrigin()

    if (!isSameOriginMutation(request, appOrigin)) {
      return publicJson(
        {error: 'Request origin is not allowed', success: false},
        403,
      )
    }

    const body = await readPublicJson(request, 16 * 1_024)
    const normalizedEmail = String(body.email ?? '')
      .trim()
      .toLowerCase()
      .slice(0, 320)
    const networkLimit = await consumeConfiguredRateLimit({
      action: 'password_reset_request_ip',
      identifier: getClientAddress(request, shouldTrustProxy()),
      policy: REQUEST_POLICY,
    })

    if (!networkLimit.allowed) {
      return publicJson(
        {error: 'Too many requests. Please try again later.', success: false},
        429,
        {'Retry-After': String(networkLimit.retryAfterSeconds)},
      )
    }

    const identityLimit = await consumeConfiguredRateLimit({
      action: 'password_reset_request_identity',
      identifier: normalizedEmail || 'invalid',
      policy: REQUEST_POLICY,
    })

    if (!identityLimit.allowed) {
      return publicJson(
        {error: 'Too many requests. Please try again later.', success: false},
        429,
        {'Retry-After': String(identityLimit.retryAfterSeconds)},
      )
    }

    try {
      await getConfiguredPasswordResetService().request(body, appOrigin)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'PASSWORD_RESET_INPUT_INVALID'
      ) {
        return publicJson(
          {error: 'Invalid password reset request', success: false},
          400,
        )
      }

      if (error instanceof Error && error.message === 'EMAIL_DELIVERY_FAILED') {
        console.error('Password reset delivery is temporarily unavailable')

        return publicJson(acceptedPayload, 202)
      }

      throw error
    }

    return publicJson(acceptedPayload, 202)
  } catch (error) {
    if (error instanceof PublicApiInputError) {
      return publicJson(
        {error: 'Invalid password reset request', success: false},
        400,
      )
    }

    console.error('Password reset request failed')

    return publicJson(
      {error: 'Unable to process password reset', success: false},
      500,
    )
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
