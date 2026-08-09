import {describe, expect, it, vi} from 'vitest'

import {createDatabaseNewsletterStore} from './database-newsletter-store'

const now = new Date('2026-08-09T12:00:00.000Z')
const subscriberId = 'b8f73ce3-8272-4691-bce8-dde03e6a9489'

function configuredDatabase(returning: unknown[] = [{id: subscriberId}]) {
  const transactionClient = {
    $queryRaw: vi.fn().mockResolvedValue(returning),
    newsletterSubscriber: {
      findUnique: vi.fn().mockResolvedValue({id: subscriberId}),
      updateMany: vi.fn().mockResolvedValue({count: 1}),
    },
    outboxJob: {create: vi.fn().mockResolvedValue({id: 'job-id'})},
  }
  const database = {
    $transaction: vi.fn(callback => callback(transactionClient)),
  }

  return {database, transactionClient}
}

describe('database newsletter store', () => {
  it('writes a subscriber and encrypted confirmation job in one transaction', async () => {
    const {database, transactionClient} = configuredDatabase()
    const store = createDatabaseNewsletterStore(database)

    await expect(
      store.requestSubscription({
        confirmationTokenEncrypted: 'encrypted-confirmation-token',
        confirmationTokenHash: 'a'.repeat(64),
        consentedAt: now,
        email: 'ada@example.com',
        idempotencyKey: `newsletter.confirmation:${'a'.repeat(64)}`,
        locale: 'en',
        source: 'homepage',
      }),
    ).resolves.toEqual({subscriberId, shouldSend: true})

    expect(database.$transaction).toHaveBeenCalledOnce()
    expect(transactionClient.outboxJob.create).toHaveBeenCalledWith({
      data: {
        idempotencyKey: `newsletter.confirmation:${'a'.repeat(64)}`,
        payload: {
          confirmationTokenEncrypted: 'encrypted-confirmation-token',
          subscriberId,
        },
        type: 'newsletter.confirmation_requested',
      },
    })
  })

  it('does not enqueue mail when an active or recently pending address wins the atomic write', async () => {
    const {database, transactionClient} = configuredDatabase([])
    const store = createDatabaseNewsletterStore(database)

    await expect(
      store.requestSubscription({
        confirmationTokenEncrypted: 'encrypted-confirmation-token',
        confirmationTokenHash: 'a'.repeat(64),
        consentedAt: now,
        email: 'ada@example.com',
        idempotencyKey: `newsletter.confirmation:${'a'.repeat(64)}`,
        locale: 'en',
        source: 'homepage',
      }),
    ).resolves.toEqual({subscriberId, shouldSend: false})

    expect(transactionClient.outboxJob.create).not.toHaveBeenCalled()
  })

  it('activates and queues welcome mail atomically only once', async () => {
    const {database, transactionClient} = configuredDatabase()
    const store = createDatabaseNewsletterStore(database)

    await expect(
      store.activate({
        confirmationTokenHash: 'a'.repeat(64),
        confirmedAt: now,
        idempotencyKey: `newsletter.welcome:${'a'.repeat(64)}`,
        unsubscribeTokenEncrypted: 'encrypted-unsubscribe-token',
        unsubscribeTokenHash: 'b'.repeat(64),
      }),
    ).resolves.toBe(true)

    expect(transactionClient.outboxJob.create).toHaveBeenCalledWith({
      data: {
        idempotencyKey: `newsletter.welcome:${'a'.repeat(64)}`,
        payload: {
          subscriberId,
          unsubscribeTokenEncrypted: 'encrypted-unsubscribe-token',
        },
        type: 'newsletter.welcome',
      },
    })
  })

  it('does not enqueue welcome mail for a consumed confirmation token', async () => {
    const {database, transactionClient} = configuredDatabase([])
    const store = createDatabaseNewsletterStore(database)

    await expect(
      store.activate({
        confirmationTokenHash: 'a'.repeat(64),
        confirmedAt: now,
        idempotencyKey: `newsletter.welcome:${'a'.repeat(64)}`,
        unsubscribeTokenEncrypted: 'encrypted-unsubscribe-token',
        unsubscribeTokenHash: 'b'.repeat(64),
      }),
    ).resolves.toBe(false)

    expect(transactionClient.outboxJob.create).not.toHaveBeenCalled()
  })

  it('unsubscribes an active address exactly once', async () => {
    const {database, transactionClient} = configuredDatabase()
    const store = createDatabaseNewsletterStore(database)

    await expect(
      store.unsubscribe({tokenHash: 'b'.repeat(64), unsubscribedAt: now}),
    ).resolves.toBe(true)
    expect(transactionClient.newsletterSubscriber.updateMany).toHaveBeenCalledWith({
      data: {
        confirmationTokenHash: null,
        status: 'UNSUBSCRIBED',
        unsubscribeTokenHash: null,
        unsubscribedAt: now,
      },
      where: {
        status: {in: ['ACTIVE', 'PENDING']},
        unsubscribeTokenHash: 'b'.repeat(64),
      },
    })
  })

  it('fails closed if an atomic no-op has no matching existing subscriber', async () => {
    const {database, transactionClient} = configuredDatabase([])
    const store = createDatabaseNewsletterStore(database)

    transactionClient.newsletterSubscriber.findUnique.mockResolvedValueOnce(null)

    await expect(
      store.requestSubscription({
        confirmationTokenEncrypted: 'encrypted-confirmation-token',
        confirmationTokenHash: 'a'.repeat(64),
        consentedAt: now,
        email: 'ada@example.com',
        idempotencyKey: `newsletter.confirmation:${'a'.repeat(64)}`,
        locale: 'en',
        source: 'homepage',
      }),
    ).rejects.toThrow('NEWSLETTER_STORAGE_FAILED')
  })
})
