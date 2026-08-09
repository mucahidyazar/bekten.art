import {z} from 'zod'

import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {
  getClientAddress,
  shouldTrustProxy,
} from '@/server/auth/request-context'
import {contentLocaleSchema} from '@/server/content/domain'
import {
  getPublicAppOrigin,
  PublicApiInputError,
  publicJson,
  readPublicJson,
} from '@/server/email/public-api'
import {operationalRepository} from '@/server/operations/database-operational-repository'

const feedbackRequestSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(320),
    locale: contentLocaleSchema,
    message: z.string().trim().min(10).max(10_000),
    name: z.string().trim().min(2).max(120),
    privacyAccepted: z.literal(true),
    subject: z.string().trim().min(2).max(200),
    website: z.literal('').optional(),
  })
  .strict()

const policy = Object.freeze({limit: 5, windowMs: 60 * 60_000})
const acceptedPayload = Object.freeze({
  message: 'Your message has been received.',
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

    const rawBody = await readPublicJson(request)

    if (typeof rawBody.website === 'string' && rawBody.website.length > 0) {
      return publicJson(acceptedPayload, 202)
    }

    const parsed = feedbackRequestSchema.safeParse(rawBody)

    if (!parsed.success) {
      return publicJson(
        {error: 'Invalid contact request', success: false},
        400,
      )
    }

    const address = getClientAddress(request, shouldTrustProxy())
    const networkLimit = await consumeConfiguredRateLimit({
      action: 'feedback_ip',
      identifier: address,
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
      action: 'feedback_identity',
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

    await operationalRepository.createFeedback({
      email: parsed.data.email,
      locale: parsed.data.locale,
      message: parsed.data.message,
      name: parsed.data.name,
      privacyAcceptedAt: new Date(),
      source: 'contact-form',
      subject: parsed.data.subject,
    })

    return publicJson(acceptedPayload, 202)
  } catch (error) {
    if (error instanceof PublicApiInputError) {
      return publicJson(
        {error: 'Invalid contact request', success: false},
        400,
      )
    }

    console.error('Feedback request failed')

    return publicJson(
      {error: 'Unable to receive your message', success: false},
      500,
    )
  }
}

export const dynamic = 'force-dynamic'
