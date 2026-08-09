import {describe, expect, it, vi} from 'vitest'

import {createNewsletterService} from './newsletter-service'

const now = new Date('2026-08-09T12:00:00.000Z')
const subscriberId = 'b8f73ce3-8272-4691-bce8-dde03e6a9489'

function configuredService() {
  const store = {
    activate: vi.fn().mockResolvedValue(true),
    requestSubscription: vi.fn().mockResolvedValue({
      subscriberId,
      shouldSend: true,
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  }
  const tokens = {
    create: vi.fn((purpose: 'confirmation' | 'unsubscribe') =>
      purpose === 'confirmation'
        ? {encrypted: 'encrypted-confirm', hash: 'a'.repeat(64)}
        : {encrypted: 'encrypted-unsubscribe', hash: 'b'.repeat(64)},
    ),
    hash: vi.fn().mockReturnValue('a'.repeat(64)),
  }

  return {
    service: createNewsletterService(store, tokens, {now: () => now}),
    store,
    tokens,
  }
}

describe('newsletter service', () => {
  it('normalizes consented subscriptions and delegates the atomic durable write', async () => {
    const {service, store} = configuredService()

    await expect(
      service.subscribe({
        consent: true,
        email: '  ADA@EXAMPLE.COM ',
        locale: 'tr',
        source: 'homepage',
      }),
    ).resolves.toEqual({accepted: true})

    expect(store.requestSubscription).toHaveBeenCalledWith({
      confirmationTokenEncrypted: 'encrypted-confirm',
      confirmationTokenHash: 'a'.repeat(64),
      consentedAt: now,
      email: 'ada@example.com',
      idempotencyKey: `newsletter.confirmation:${'a'.repeat(64)}`,
      locale: 'tr',
      source: 'homepage',
    })
  })

  it('requires explicit consent and rejects unknown fields', async () => {
    const {service, store} = configuredService()

    await expect(
      service.subscribe({
        consent: false,
        email: 'ada@example.com',
        locale: 'en',
        source: 'homepage',
      }),
    ).rejects.toThrow('NEWSLETTER_INPUT_INVALID')
    await expect(
      service.subscribe({
        consent: true,
        email: 'ada@example.com',
        extra: 'not-allowed',
        locale: 'en',
        source: 'homepage',
      }),
    ).rejects.toThrow('NEWSLETTER_INPUT_INVALID')
    expect(store.requestSubscription).not.toHaveBeenCalled()
  })

  it('atomically activates a pending subscriber and queues a welcome message', async () => {
    const {service, store, tokens} = configuredService()

    await expect(service.confirm('plain-confirmation-token')).resolves.toEqual({
      accepted: true,
    })

    expect(tokens.hash).toHaveBeenCalledWith('plain-confirmation-token')
    expect(store.activate).toHaveBeenCalledWith({
      confirmationTokenHash: 'a'.repeat(64),
      confirmedAt: now,
      idempotencyKey: `newsletter.welcome:${'a'.repeat(64)}`,
      unsubscribeTokenEncrypted: 'encrypted-unsubscribe',
      unsubscribeTokenHash: 'b'.repeat(64),
    })
  })

  it('returns the same generic result for consumed confirmation and unsubscribe tokens', async () => {
    const {service, store} = configuredService()

    store.activate.mockResolvedValueOnce(false)
    store.unsubscribe.mockResolvedValueOnce(false)

    await expect(service.confirm('already-consumed-token')).resolves.toEqual({
      accepted: true,
    })
    await expect(service.unsubscribe('unknown-token')).resolves.toEqual({
      accepted: true,
    })
  })

  it('does not query storage for malformed public tokens', async () => {
    const {service, store, tokens} = configuredService()

    await expect(service.confirm('')).resolves.toEqual({accepted: true})
    await expect(service.unsubscribe('x'.repeat(513))).resolves.toEqual({
      accepted: true,
    })

    expect(tokens.hash).not.toHaveBeenCalled()
    expect(store.activate).not.toHaveBeenCalled()
    expect(store.unsubscribe).not.toHaveBeenCalled()
  })
})
