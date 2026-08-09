import {describe, expect, it} from 'vitest'

import {
  artworkCreateSchema,
  newsletterSubscriberCreateSchema,
  outboxJobCreateSchema,
  rateLimitBucketInputSchema,
} from './domain'

describe('typed content domain schemas', () => {
  it('requires meaningful accessible artwork metadata', () => {
    expect(() =>
      artworkCreateSchema.parse({
        locale: 'en',
        slug: 'untitled',
        title: 'Untitled',
        description: 'A sufficiently descriptive public artwork summary.',
        imageUrl: '/media/untitled.webp',
        imageAlt: '',
        isAvailable: true,
        displayOrder: 0,
        status: 'DRAFT',
      }),
    ).toThrow()
  })

  it('rejects incomplete pricing and publication metadata', () => {
    const base = {
      locale: 'en' as const,
      slug: 'untitled',
      title: 'Untitled',
      description: 'A sufficiently descriptive public artwork summary.',
      imageUrl: '/media/untitled.webp',
      imageAlt: 'A monochrome abstract artwork',
      isAvailable: true,
      displayOrder: 0,
    }

    expect(() =>
      artworkCreateSchema.parse({...base, priceMinor: 120_000}),
    ).toThrow()
    expect(() =>
      artworkCreateSchema.parse({...base, status: 'PUBLISHED'}),
    ).toThrow()
  })

  it('normalizes newsletter email addresses and records consent', () => {
    const consentedAt = new Date('2026-08-09T12:00:00.000Z')
    const result = newsletterSubscriberCreateSchema.parse({
      email: '  ART@EXAMPLE.COM ',
      locale: 'tr',
      source: 'footer',
      consentedAt,
    })

    expect(result.email).toBe('art@example.com')
    expect(result.consentedAt).toEqual(consentedAt)
  })

  it('requires an idempotency key for outbox work', () => {
    expect(() =>
      outboxJobCreateSchema.parse({
        type: 'contact.received',
        payload: {contactId: 'd2d04f89-86fd-43f6-b0d8-96f7177fda67'},
        idempotencyKey: '',
      }),
    ).toThrow()
  })

  it('requires hashed, bounded rate limit bucket counters', () => {
    expect(() =>
      rateLimitBucketInputSchema.parse({
        action: 'contact-form',
        attempts: 0,
        key: 'not-a-sha256-hash',
        windowStart: new Date('2026-08-09T12:00:00.000Z'),
      }),
    ).toThrow()
  })
})
