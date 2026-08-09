import type {NewsletterStore} from './newsletter-service'

type IdentifierRow = Readonly<{id: string}>

type NewsletterTransaction = Readonly<{
  $queryRaw: <Result>(
    strings: TemplateStringsArray,
    ...values: readonly unknown[]
  ) => Promise<Result>
  newsletterSubscriber: Readonly<{
    findUnique: (args: unknown) => Promise<IdentifierRow | null>
    updateMany: (args: unknown) => Promise<Readonly<{count: number}>>
  }>
  outboxJob: Readonly<{
    create: (args: unknown) => Promise<unknown>
  }>
}>

export type NewsletterDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: NewsletterTransaction) => Promise<Result>,
  ) => Promise<Result>
}>

const RESEND_COOLDOWN_MS = 15 * 60_000

export function createDatabaseNewsletterStore(
  database: NewsletterDatabase,
): NewsletterStore {
  return Object.freeze({
    async activate(input) {
      return database.$transaction(async transaction => {
        const activated = await transaction.$queryRaw<IdentifierRow[]>`
          UPDATE newsletter_subscribers
          SET
            status = 'ACTIVE'::"NewsletterStatus",
            confirmed_at = ${input.confirmedAt},
            confirmation_token_hash = NULL,
            unsubscribe_token_hash = ${input.unsubscribeTokenHash},
            unsubscribed_at = NULL,
            updated_at = ${input.confirmedAt}
          WHERE
            confirmation_token_hash = ${input.confirmationTokenHash}
            AND status = 'PENDING'::"NewsletterStatus"
          RETURNING id
        `
        const subscriber = activated[0]

        if (!subscriber) {
          return false
        }

        await transaction.outboxJob.create({
          data: {
            idempotencyKey: input.idempotencyKey,
            payload: {
              subscriberId: subscriber.id,
              unsubscribeTokenEncrypted: input.unsubscribeTokenEncrypted,
            },
            type: 'newsletter.welcome',
          },
        })

        return true
      })
    },
    async requestSubscription(input) {
      return database.$transaction(async transaction => {
        const cooldownStartedAt = new Date(
          input.consentedAt.getTime() - RESEND_COOLDOWN_MS,
        )
        const accepted = await transaction.$queryRaw<IdentifierRow[]>`
          INSERT INTO newsletter_subscribers (
            id,
            email,
            locale,
            source,
            status,
            consented_at,
            confirmation_token_hash,
            created_at,
            updated_at
          )
          VALUES (
            gen_random_uuid(),
            ${input.email},
            ${input.locale},
            ${input.source},
            'PENDING'::"NewsletterStatus",
            ${input.consentedAt},
            ${input.confirmationTokenHash},
            ${input.consentedAt},
            ${input.consentedAt}
          )
          ON CONFLICT (email) DO UPDATE
          SET
            locale = EXCLUDED.locale,
            source = EXCLUDED.source,
            status = 'PENDING'::"NewsletterStatus",
            consented_at = EXCLUDED.consented_at,
            confirmed_at = NULL,
            unsubscribed_at = NULL,
            confirmation_token_hash = EXCLUDED.confirmation_token_hash,
            unsubscribe_token_hash = NULL,
            updated_at = EXCLUDED.updated_at
          WHERE
            newsletter_subscribers.status IN (
              'UNSUBSCRIBED'::"NewsletterStatus",
              'BOUNCED'::"NewsletterStatus"
            )
            OR (
              newsletter_subscribers.status = 'PENDING'::"NewsletterStatus"
              AND newsletter_subscribers.updated_at <= ${cooldownStartedAt}
            )
          RETURNING id
        `
        const subscriber = accepted[0]

        if (!subscriber) {
          const existing = await transaction.newsletterSubscriber.findUnique({
            select: {id: true},
            where: {email: input.email},
          })

          if (!existing) {
            throw new Error('NEWSLETTER_STORAGE_FAILED')
          }

          return {subscriberId: existing.id, shouldSend: false}
        }

        await transaction.outboxJob.create({
          data: {
            idempotencyKey: input.idempotencyKey,
            payload: {
              confirmationTokenEncrypted: input.confirmationTokenEncrypted,
              subscriberId: subscriber.id,
            },
            type: 'newsletter.confirmation_requested',
          },
        })

        return {subscriberId: subscriber.id, shouldSend: true}
      })
    },
    async unsubscribe(input) {
      return database.$transaction(async transaction => {
        const updated = await transaction.newsletterSubscriber.updateMany({
          data: {
            confirmationTokenHash: null,
            status: 'UNSUBSCRIBED',
            unsubscribeTokenHash: null,
            unsubscribedAt: input.unsubscribedAt,
          },
          where: {
            status: {in: ['ACTIVE', 'PENDING']},
            unsubscribeTokenHash: input.tokenHash,
          },
        })

        return updated.count === 1
      })
    },
  })
}
