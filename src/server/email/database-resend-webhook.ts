import {z} from 'zod'

import type {ResendWebhookStore} from './resend-webhook'

type Database = Readonly<{
  $queryRaw: <Result>(
    strings: TemplateStringsArray,
    ...values: readonly unknown[]
  ) => Promise<Result>
}>

const resultSchema = z.object({
  inserted: z.boolean(),
  suppressed: z.number().int().nonnegative(),
})

export function createDatabaseResendWebhookStore(
  database: Database,
): ResendWebhookStore {
  return Object.freeze({
    async record(input) {
      const rows = await database.$queryRaw<unknown[]>`
        WITH inserted AS (
          INSERT INTO email_webhook_events (
            id,
            provider,
            external_id,
            event_type,
            provider_message_id,
            occurred_at,
            processed_at,
            created_at
          )
          VALUES (
            gen_random_uuid(),
            'resend',
            ${input.eventId},
            ${input.eventType},
            ${input.providerMessageId},
            ${input.occurredAt},
            NOW(),
            NOW()
          )
          ON CONFLICT (provider, external_id) DO NOTHING
          RETURNING id
        ),
        suppressed AS (
          UPDATE newsletter_subscribers
          SET
            status = 'BOUNCED'::"NewsletterStatus",
            confirmation_token_hash = NULL,
            unsubscribe_token_hash = NULL,
            updated_at = NOW()
          WHERE
            ${input.suppressRecipients}
            AND EXISTS (SELECT 1 FROM inserted)
            AND LOWER(email) = ANY(${input.recipients}::text[])
          RETURNING id
        )
        SELECT
          EXISTS (SELECT 1 FROM inserted) AS inserted,
          (SELECT COUNT(*)::int FROM suppressed) AS suppressed
      `

      return resultSchema.parse(rows[0])
    },
  })
}
