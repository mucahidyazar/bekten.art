import {z} from 'zod'

const headerSchema = z.object({
  id: z.string().min(1).max(200),
  payload: z.string().min(2).max(256 * 1_024),
  signature: z.string().min(1).max(2_048),
  timestamp: z.string().regex(/^\d{10,13}$/u),
})
const eventSchema = z.object({
  created_at: z.coerce.date(),
  data: z.object({
    email_id: z.string().min(1).max(160),
    to: z.array(z.string().email().max(320)).min(1).max(50),
  }).passthrough(),
  type: z.string().regex(/^email\.[a-z_]+$/u).max(120),
}).passthrough()

type WebhookVerifier = Readonly<{
  verify: (input: Readonly<{
    headers: Readonly<{id: string; signature: string; timestamp: string}>
    payload: string
  }>) => unknown
}>

export type ResendWebhookStore = Readonly<{
  record: (input: Readonly<{
    eventId: string
    eventType: string
    occurredAt: Date
    providerMessageId: string
    recipients: readonly string[]
    suppressRecipients: boolean
  }>) => Promise<Readonly<{inserted: boolean; suppressed: number}>>
}>

export function createResendWebhookService(
  verifier: WebhookVerifier,
  store: ResendWebhookStore,
) {
  return Object.freeze({
    async handle(input: unknown) {
      const parsed = headerSchema.safeParse(input)

      if (!parsed.success) throw new Error('RESEND_WEBHOOK_INVALID')

      let verified: unknown

      try {
        verified = verifier.verify({
          headers: {
            id: parsed.data.id,
            signature: parsed.data.signature,
            timestamp: parsed.data.timestamp,
          },
          payload: parsed.data.payload,
        })
      } catch {
        throw new Error('RESEND_WEBHOOK_INVALID')
      }

      const event = eventSchema.safeParse(verified)

      if (!event.success) throw new Error('RESEND_WEBHOOK_INVALID')

      await store.record({
        eventId: parsed.data.id,
        eventType: event.data.type,
        occurredAt: event.data.created_at,
        providerMessageId: event.data.data.email_id,
        recipients: [...new Set(event.data.data.to.map(email => email.toLowerCase()))],
        suppressRecipients: ['email.bounced', 'email.complained'].includes(
          event.data.type,
        ),
      })

      return Object.freeze({accepted: true})
    },
  })
}
