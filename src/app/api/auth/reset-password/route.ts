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

const RESET_POLICY = Object.freeze({limit: 10, windowMs: 15 * 60 * 1_000})
const invalidPayload = Object.freeze({
  error: 'Reset link is invalid or expired.',
  success: false,
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
    const networkLimit = await consumeConfiguredRateLimit({
      action: 'password_reset_ip',
      identifier: getClientAddress(request, shouldTrustProxy()),
      policy: RESET_POLICY,
    })

    if (!networkLimit.allowed) {
      return publicJson(
        {error: 'Too many requests. Please try again later.', success: false},
        429,
        {'Retry-After': String(networkLimit.retryAfterSeconds)},
      )
    }

    const tokenLimit = await consumeConfiguredRateLimit({
      action: 'password_reset_token',
      identifier: String(body.token ?? '').slice(0, 512) || 'invalid',
      policy: RESET_POLICY,
    })

    if (!tokenLimit.allowed) {
      return publicJson(
        {error: 'Too many requests. Please try again later.', success: false},
        429,
        {'Retry-After': String(tokenLimit.retryAfterSeconds)},
      )
    }

    const reset = await getConfiguredPasswordResetService().reset(body)

    return reset
      ? publicJson({success: true}, 200)
      : publicJson(invalidPayload, 400)
  } catch (error) {
    if (
      error instanceof PublicApiInputError ||
      (error instanceof Error &&
        error.message === 'PASSWORD_RESET_INPUT_INVALID')
    ) {
      return publicJson(invalidPayload, 400)
    }

    console.error('Password reset failed')

    return publicJson({error: 'Unable to reset password', success: false}, 500)
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
