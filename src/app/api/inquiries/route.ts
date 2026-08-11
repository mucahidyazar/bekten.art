import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {createRateLimitKey} from '@/server/auth/rate-limit'
import {
  getClientAddress,
  getRequiredAuthSecret,
  shouldTrustProxy,
} from '@/server/auth/request-context'
import {
  getPublicAppOrigin,
  PublicApiInputError,
  publicJson,
  readPublicJson,
} from '@/server/email/public-api'
import {configuredInquiryService} from '@/server/inquiries/configured-inquiry-service'
import {publicInquiryInputSchema} from '@/server/inquiries/inquiry-validation'

const networkPolicy = Object.freeze({limit: 5, windowMs: 60 * 60_000})
const identityPolicy = Object.freeze({limit: 3, windowMs: 60 * 60_000})
const acceptedPayload = Object.freeze({
  message: 'Your private request has been received.',
  success: true,
})

function retryResponse(retryAfterSeconds: number) {
  return publicJson(
    {error: 'Too many requests. Please try again later.', success: false},
    429,
    {'Retry-After': String(retryAfterSeconds)},
  )
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginMutation(request, getPublicAppOrigin())) {
      return publicJson(
        {error: 'Request origin is not allowed', success: false},
        403,
      )
    }

    const rawBody = await readPublicJson(request)
    const website = rawBody.website

    if (website !== undefined && typeof website !== 'string') {
      return publicJson(
        {error: 'Invalid inquiry request', success: false},
        400,
      )
    }

    if (website) return publicJson(acceptedPayload, 202)

    const candidate = Object.fromEntries(
      Object.entries(rawBody).filter(([key]) => key !== 'website'),
    )
    const parsed = publicInquiryInputSchema.safeParse(candidate)

    if (!parsed.success) {
      return publicJson(
        {error: 'Invalid inquiry request', success: false},
        400,
      )
    }

    const address = getClientAddress(request, shouldTrustProxy())
    const networkLimit = await consumeConfiguredRateLimit({
      action: 'inquiry_network',
      identifier: address,
      policy: networkPolicy,
    })

    if (!networkLimit.allowed) {
      return retryResponse(networkLimit.retryAfterSeconds)
    }

    const identityLimit = await consumeConfiguredRateLimit({
      action: 'inquiry_identity',
      identifier: parsed.data.email,
      policy: identityPolicy,
    })

    if (!identityLimit.allowed) {
      return retryResponse(identityLimit.retryAfterSeconds)
    }

    const abuseKeyHash = createRateLimitKey(
      `${address}:${parsed.data.email}`,
      getRequiredAuthSecret(),
    )

    await configuredInquiryService.submit(parsed.data, {
      abuseKeyHash,
      source: 'WEBSITE',
    })

    return publicJson(acceptedPayload, 202)
  } catch (error) {
    if (error instanceof PublicApiInputError) {
      return publicJson(
        {error: 'Invalid inquiry request', success: false},
        400,
      )
    }

    console.error('Inquiry request failed')

    return publicJson(
      {error: 'Unable to receive your inquiry', success: false},
      500,
    )
  }
}

export const dynamic = 'force-dynamic'
