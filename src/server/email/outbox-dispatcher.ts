import {z} from 'zod'

import {outboxJobRowSchema, uuidSchema} from '@/server/content/domain'

const feedbackPayloadSchema = z.object({feedbackId: uuidSchema}).strict()
const inquiryPayloadSchema = z
  .object({
    inquiryId: uuidSchema,
    locale: z.enum(['en', 'tr', 'ru', 'ky']),
    type: z.enum([
      'AVAILABILITY',
      'COLLECTOR',
      'COMMISSION',
      'PRIVATE_VIEWING',
      'GENERAL',
    ]),
  })
  .strict()
const inquiryMessageSchema = z
  .object({
    brief: z.string().max(4_000).nullable(),
    email: z.email().max(320),
    locale: z.enum(['en', 'tr', 'ru', 'ky']),
    message: z.string().max(4_000).nullable(),
    name: z.string().min(2).max(120),
    relatedArtworkTitle: z.string().max(200).nullable(),
    subject: z.string().max(200).nullable(),
    type: z.enum([
      'AVAILABILITY',
      'COLLECTOR',
      'COMMISSION',
      'PRIVATE_VIEWING',
      'GENERAL',
    ]),
  })
  .strict()
const newsletterConfirmationPayloadSchema = z
  .object({
    confirmationTokenEncrypted: z.string().min(20).max(2_048),
    subscriberId: uuidSchema,
  })
  .strict()
const newsletterWelcomePayloadSchema = z
  .object({
    subscriberId: uuidSchema,
    unsubscribeTokenEncrypted: z.string().min(20).max(2_048),
  })
  .strict()
const studioMagicLinkPayloadSchema = z
  .object({
    expiresAt: z.iso.datetime(),
    signInUrlEncrypted: z.string().min(20).max(8_192),
    to: z.email().max(320),
  })
  .strict()

type ClaimedJob = z.infer<typeof outboxJobRowSchema>

type FeedbackMessage = Readonly<{
  email: string
  message: string
  name: string
  subject: string
}>

type Subscriber = Readonly<{
  email: string
  locale: 'en' | 'tr' | 'ru' | 'ky'
}>

type InquiryMessage = Readonly<z.infer<typeof inquiryMessageSchema>>

export type OutboxMailer = Readonly<{
  sendFeedbackAcknowledgement: (
    input: Readonly<{
      idempotencyKey: string
      name: string
      to: string
    }>,
  ) => Promise<unknown>
  sendFeedbackNotification: (
    input: Readonly<{
      idempotencyKey: string
      message: string
      name: string
      replyTo: string
      subject: string
    }>,
  ) => Promise<unknown>
  sendInquiryAcknowledgement: (
    input: Readonly<{
      idempotencyKey: string
      locale: Subscriber['locale']
      name: string
      to: string
      type: InquiryMessage['type']
    }>,
  ) => Promise<unknown>
  sendInquiryNotification: (
    input: Readonly<{
      idempotencyKey: string
      inquiry: InquiryMessage
      replyTo: string
    }>,
  ) => Promise<unknown>
  sendNewsletterConfirmation: (
    input: Readonly<{
      confirmationUrl: string
      idempotencyKey: string
      locale: Subscriber['locale']
      to: string
    }>,
  ) => Promise<unknown>
  sendNewsletterWelcome: (
    input: Readonly<{
      idempotencyKey: string
      locale: Subscriber['locale']
      to: string
      unsubscribeUrl: string
    }>,
  ) => Promise<unknown>
  sendStudioMagicLink: (
    input: Readonly<{
      expiresAt: Date
      idempotencyKey: string
      signInUrl: string
      to: string
    }>,
  ) => Promise<unknown>
}>

export type OutboxStore = Readonly<{
  claim: (
    input: Readonly<{
      lockExpiredBefore: Date
      now: Date
      workerId: string
    }>,
  ) => Promise<unknown | null>
  complete: (
    id: string,
    workerId: string,
    completedAt: Date,
  ) => Promise<boolean>
  findFeedback: (id: string) => Promise<FeedbackMessage | null>
  findInquiry: (id: string) => Promise<InquiryMessage | null>
  findSubscriber: (id: string) => Promise<Subscriber | null>
  retry: (
    id: string,
    workerId: string,
    input: Readonly<{
      availableAt: Date
      error: string
      terminal: boolean
    }>,
  ) => Promise<boolean>
}>

type EngagementTokenReader = Readonly<{
  decrypt: (encrypted: string) => string
  openStudioMagicLink: (encrypted: string) => string
}>

const transientError = 'EMAIL_DELIVERY_FAILED'
const permanentError = 'OUTBOX_PAYLOAD_INVALID'
const claimedJobIdentitySchema = z.object({id: uuidSchema}).passthrough()

function addMilliseconds(value: Date, milliseconds: number) {
  return new Date(value.getTime() + milliseconds)
}

function retryDelay(attempts: number) {
  const exponent = Math.max(0, Math.min(10, attempts - 1))

  return Math.min(15 * 60_000, 30_000 * 2 ** exponent)
}

function tokenUrl(
  appUrl: string,
  path: string,
  token: string,
  locale?: Subscriber['locale'],
) {
  const target = new URL(path, new URL(appUrl).origin)

  target.searchParams.set('token', token)

  if (locale) target.searchParams.set('locale', locale)

  return target.toString()
}

export function createOutboxDispatcher(
  store: OutboxStore,
  mailer: OutboxMailer,
  tokens: EngagementTokenReader,
  dependencies: Readonly<{
    appUrl: string
    lockTimeoutMs?: number
    now?: () => Date
    workerId: string
  }>,
) {
  const now = dependencies.now ?? (() => new Date())
  const lockTimeoutMs = dependencies.lockTimeoutMs ?? 5 * 60_000

  async function requireFeedback(id: string) {
    const feedback = await store.findFeedback(id)

    if (!feedback) {
      throw new Error(permanentError)
    }

    return feedback
  }

  async function requireSubscriber(id: string) {
    const subscriber = await store.findSubscriber(id)

    if (!subscriber) {
      throw new Error(permanentError)
    }

    return subscriber
  }

  async function requireInquiry(id: string) {
    const inquiry = inquiryMessageSchema.safeParse(await store.findInquiry(id))

    if (!inquiry.success) {
      throw new Error(permanentError)
    }

    return inquiry.data
  }

  async function deliver(job: ClaimedJob) {
    if (job.type === 'feedback.created') {
      const parsed = feedbackPayloadSchema.safeParse(job.payload)

      if (!parsed.success) {
        throw new Error(permanentError)
      }

      const feedback = await requireFeedback(parsed.data.feedbackId)

      await mailer.sendFeedbackNotification({
        idempotencyKey: `${job.idempotencyKey}:support`,
        message: feedback.message,
        name: feedback.name,
        replyTo: feedback.email,
        subject: feedback.subject,
      })
      await mailer.sendFeedbackAcknowledgement({
        idempotencyKey: `${job.idempotencyKey}:acknowledgement`,
        name: feedback.name,
        to: feedback.email,
      })

      return
    }

    if (job.type === 'inquiry.created') {
      const parsed = inquiryPayloadSchema.safeParse(job.payload)

      if (!parsed.success) {
        throw new Error(permanentError)
      }

      const inquiry = await requireInquiry(parsed.data.inquiryId)

      if (
        inquiry.locale !== parsed.data.locale ||
        inquiry.type !== parsed.data.type
      ) {
        throw new Error(permanentError)
      }

      await mailer.sendInquiryNotification({
        idempotencyKey: `${job.idempotencyKey}:support`,
        inquiry,
        replyTo: inquiry.email,
      })
      await mailer.sendInquiryAcknowledgement({
        idempotencyKey: `${job.idempotencyKey}:acknowledgement`,
        locale: inquiry.locale,
        name: inquiry.name,
        to: inquiry.email,
        type: inquiry.type,
      })

      return
    }

    if (job.type === 'newsletter.confirmation_requested') {
      const parsed = newsletterConfirmationPayloadSchema.safeParse(job.payload)

      if (!parsed.success) {
        throw new Error(permanentError)
      }

      const subscriber = await requireSubscriber(parsed.data.subscriberId)
      const token = tokens.decrypt(parsed.data.confirmationTokenEncrypted)

      await mailer.sendNewsletterConfirmation({
        confirmationUrl: tokenUrl(
          dependencies.appUrl,
          '/api/newsletter/confirm',
          token,
          subscriber.locale,
        ),
        idempotencyKey: job.idempotencyKey,
        locale: subscriber.locale,
        to: subscriber.email,
      })

      return
    }

    if (job.type === 'newsletter.welcome') {
      const parsed = newsletterWelcomePayloadSchema.safeParse(job.payload)

      if (!parsed.success) {
        throw new Error(permanentError)
      }

      const subscriber = await requireSubscriber(parsed.data.subscriberId)
      const token = tokens.decrypt(parsed.data.unsubscribeTokenEncrypted)

      await mailer.sendNewsletterWelcome({
        idempotencyKey: job.idempotencyKey,
        locale: subscriber.locale,
        to: subscriber.email,
        unsubscribeUrl: tokenUrl(
          dependencies.appUrl,
          '/api/newsletter/unsubscribe',
          token,
          subscriber.locale,
        ),
      })

      return
    }

    if (job.type === 'studio.magic-link.requested') {
      const parsed = studioMagicLinkPayloadSchema.safeParse(job.payload)

      if (!parsed.success) {
        throw new Error(permanentError)
      }

      const expiresAt = new Date(parsed.data.expiresAt)
      let signInUrl: URL

      try {
        signInUrl = new URL(
          tokens.openStudioMagicLink(parsed.data.signInUrlEncrypted),
        )
      } catch {
        throw new Error(permanentError)
      }

      if (
        expiresAt.getTime() <= now().getTime() ||
        signInUrl.origin !== new URL(dependencies.appUrl).origin ||
        signInUrl.pathname !== '/api/auth/callback/email' ||
        !signInUrl.searchParams.get('token')
      ) {
        throw new Error(permanentError)
      }

      await mailer.sendStudioMagicLink({
        expiresAt,
        idempotencyKey: job.idempotencyKey,
        signInUrl: signInUrl.toString(),
        to: parsed.data.to,
      })

      return
    }

    throw new Error(permanentError)
  }

  async function dispatchOne() {
    const claimedAt = now()
    const rawJob = await store.claim({
      lockExpiredBefore: addMilliseconds(claimedAt, -lockTimeoutMs),
      now: claimedAt,
      workerId: dependencies.workerId,
    })

    if (!rawJob) {
      return {status: 'idle'} as const
    }

    const parsedJob = outboxJobRowSchema.safeParse(rawJob)

    if (!parsedJob.success) {
      const identity = claimedJobIdentitySchema.safeParse(rawJob)

      if (identity.success) {
        await store.retry(identity.data.id, dependencies.workerId, {
          availableAt: claimedAt,
          error: permanentError,
          terminal: true,
        })
      }

      return {status: 'failed'} as const
    }

    const job = parsedJob.data

    try {
      await deliver(job)
      await store.complete(job.id, dependencies.workerId, claimedAt)

      return {status: 'completed'} as const
    } catch (error) {
      const terminal =
        (error instanceof Error && error.message === permanentError) ||
        job.attempts >= job.maxAttempts
      const safeError = terminal ? permanentError : transientError

      await store.retry(job.id, dependencies.workerId, {
        availableAt: addMilliseconds(claimedAt, retryDelay(job.attempts)),
        error: safeError,
        terminal,
      })

      return {status: terminal ? ('failed' as const) : ('retrying' as const)}
    }
  }

  async function dispatchBatch(limitInput = 10) {
    const limit = z.number().int().min(1).max(50).parse(limitInput)

    async function next(
      remaining: number,
      summary: Readonly<{completed: number; failed: number; retrying: number}>,
    ): Promise<
      Readonly<{completed: number; failed: number; retrying: number}>
    > {
      if (remaining === 0) {
        return summary
      }

      const result = await dispatchOne()

      if (result.status === 'idle') {
        return summary
      }

      return next(remaining - 1, {
        ...summary,
        [result.status]: summary[result.status] + 1,
      })
    }

    return next(limit, {completed: 0, failed: 0, retrying: 0})
  }

  return Object.freeze({dispatchBatch, dispatchOne})
}
