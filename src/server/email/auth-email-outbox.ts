import {z} from 'zod'

import {contentLocaleSchema} from '@/server/content/domain'

const baseSchema = z.object({
  idempotencyKey: z.string().min(20).max(200),
  name: z.string().max(100).nullable(),
  to: z.string().email().max(320),
})
const verificationSchema = baseSchema.extend({
  verificationUrl: z.string().url().max(2_048),
})
const resetSchema = baseSchema.extend({
  locale: contentLocaleSchema,
  resetUrl: z.string().url().max(2_048),
})

export type AuthOutboxStore = Readonly<{
  create: (input: unknown) => Promise<unknown>
}>

type UrlEncryptor = Readonly<{
  encrypt: (plain: string) => string
}>

export function createAuthEmailOutbox(
  store: AuthOutboxStore,
  tokens: UrlEncryptor,
) {
  return Object.freeze({
    async enqueuePasswordReset(input: z.input<typeof resetSchema>) {
      const parsed = resetSchema.parse(input)

      await store.create({
        data: {
          idempotencyKey: parsed.idempotencyKey,
          payload: {
            locale: parsed.locale,
            name: parsed.name,
            resetUrlEncrypted: tokens.encrypt(parsed.resetUrl),
            to: parsed.to,
          },
          type: 'auth.password_reset',
        },
      })
    },
    async enqueueVerification(input: z.input<typeof verificationSchema>) {
      const parsed = verificationSchema.parse(input)

      await store.create({
        data: {
          idempotencyKey: parsed.idempotencyKey,
          payload: {
            locale: 'en',
            name: parsed.name,
            to: parsed.to,
            verificationUrlEncrypted: tokens.encrypt(parsed.verificationUrl),
          },
          type: 'auth.email_verification',
        },
      })
    },
  })
}
