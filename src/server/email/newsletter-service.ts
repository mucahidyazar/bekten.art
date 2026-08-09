import {z} from 'zod'

import {contentLocaleSchema} from '@/server/content/domain'

const subscribeSchema = z
  .object({
    consent: z.literal(true),
    email: z.string().trim().toLowerCase().email().max(320),
    locale: contentLocaleSchema,
    source: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9][a-z0-9_-]*$/u),
  })
  .strict()

const publicTokenSchema = z.string().min(1).max(512)

export type EngagementTokenService = Readonly<{
  create: (purpose: 'confirmation' | 'unsubscribe') => Readonly<{
    encrypted: string
    hash: string
    plain?: string
  }>
  hash: (plain: string) => string
}>

export type NewsletterStore = Readonly<{
  activate: (input: Readonly<{
    confirmationTokenHash: string
    confirmedAt: Date
    idempotencyKey: string
    unsubscribeTokenEncrypted: string
    unsubscribeTokenHash: string
  }>) => Promise<boolean>
  requestSubscription: (input: Readonly<{
    confirmationTokenEncrypted: string
    confirmationTokenHash: string
    consentedAt: Date
    email: string
    idempotencyKey: string
    locale: z.infer<typeof contentLocaleSchema>
    source: string
  }>) => Promise<Readonly<{subscriberId: string; shouldSend: boolean}>>
  unsubscribe: (input: Readonly<{
    tokenHash: string
    unsubscribedAt: Date
  }>) => Promise<boolean>
}>

export function createNewsletterService(
  store: NewsletterStore,
  tokens: EngagementTokenService,
  dependencies: Readonly<{now?: () => Date}> = {},
) {
  const now = dependencies.now ?? (() => new Date())

  return Object.freeze({
    async confirm(tokenInput: string) {
      const token = publicTokenSchema.safeParse(tokenInput)

      if (!token.success) {
        return {accepted: true} as const
      }

      const confirmationTokenHash = tokens.hash(token.data)
      const unsubscribeToken = tokens.create('unsubscribe')

      await store.activate({
        confirmationTokenHash,
        confirmedAt: now(),
        idempotencyKey: `newsletter.welcome:${confirmationTokenHash}`,
        unsubscribeTokenEncrypted: unsubscribeToken.encrypted,
        unsubscribeTokenHash: unsubscribeToken.hash,
      })

      return {accepted: true} as const
    },
    async subscribe(input: unknown) {
      const parsed = subscribeSchema.safeParse(input)

      if (!parsed.success) {
        throw new Error('NEWSLETTER_INPUT_INVALID')
      }

      const confirmationToken = tokens.create('confirmation')

      await store.requestSubscription({
        confirmationTokenEncrypted: confirmationToken.encrypted,
        confirmationTokenHash: confirmationToken.hash,
        consentedAt: now(),
        email: parsed.data.email,
        idempotencyKey: `newsletter.confirmation:${confirmationToken.hash}`,
        locale: parsed.data.locale,
        source: parsed.data.source,
      })

      return {accepted: true} as const
    },
    async unsubscribe(tokenInput: string) {
      const token = publicTokenSchema.safeParse(tokenInput)

      if (token.success) {
        await store.unsubscribe({
          tokenHash: tokens.hash(token.data),
          unsubscribedAt: now(),
        })
      }

      return {accepted: true} as const
    },
  })
}
