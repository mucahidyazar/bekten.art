import {z} from 'zod'

import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {
  getClientAddress,
  shouldTrustProxy,
} from '@/server/auth/request-context'
import {contentLocaleSchema} from '@/server/content/domain'
import {getConfiguredNewsletterService} from '@/server/email/configured-newsletter-service'
import {
  getPublicAppOrigin,
  PublicApiInputError,
  publicJson,
  readPublicJson,
} from '@/server/email/public-api'

const requestSchema = z
  .object({
    consent: z.literal(true),
    email: z.string().trim().toLowerCase().email().max(320),
    locale: contentLocaleSchema,
    source: z.enum(['homepage', 'footer', 'newsletter']),
    website: z.literal('').optional(),
  })
  .strict()
const policy = Object.freeze({limit: 3, windowMs: 60 * 60_000})
const acceptedPayload = Object.freeze({
  message: 'Check your inbox to confirm your subscription.',
  success: true,
})

export async function POST(request: Request) {
  try {
    if (!isSameOriginMutation(request, getPublicAppOrigin())) {
      return publicJson(
        {error: 'Request origin is not allowed', success: false},
        403,
      )
    }

    const rawBody = await readPublicJson(request, 8 * 1_024)

    if (typeof rawBody.website === 'string' && rawBody.website.length > 0) {
      return publicJson(acceptedPayload, 202)
    }

    const parsed = requestSchema.safeParse(rawBody)

    if (!parsed.success) {
      return publicJson(
        {error: 'Invalid subscription request', success: false},
        400,
      )
    }

    const networkLimit = await consumeConfiguredRateLimit({
      action: 'newsletter_ip',
      identifier: getClientAddress(request, shouldTrustProxy()),
      policy,
    })

    if (!networkLimit.allowed) {
      return publicJson(
        {error: 'Too many requests. Please try again later.', success: false},
        429,
        {'Retry-After': String(networkLimit.retryAfterSeconds)},
      )
    }

    const identityLimit = await consumeConfiguredRateLimit({
      action: 'newsletter_identity',
      identifier: parsed.data.email,
      policy,
    })

    if (!identityLimit.allowed) {
      return publicJson(
        {error: 'Too many requests. Please try again later.', success: false},
        429,
        {'Retry-After': String(identityLimit.retryAfterSeconds)},
      )
    }

    await getConfiguredNewsletterService().subscribe({
      consent: parsed.data.consent,
      email: parsed.data.email,
      locale: parsed.data.locale,
      source: parsed.data.source,
    })

    return publicJson(acceptedPayload, 202)
  } catch (error) {
    if (
      error instanceof PublicApiInputError ||
      (error instanceof Error && error.message === 'NEWSLETTER_INPUT_INVALID')
    ) {
      return publicJson(
        {error: 'Invalid subscription request', success: false},
        400,
      )
    }

    console.error('Newsletter request failed')

    return publicJson(
      {error: 'Unable to process subscription', success: false},
      500,
    )
  }
}

export const dynamic = 'force-dynamic'
