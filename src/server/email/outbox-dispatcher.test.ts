import {describe, expect, it, vi} from 'vitest'

import {createOutboxDispatcher} from './outbox-dispatcher'

const now = new Date('2026-08-09T12:00:00.000Z')

function job(overrides: Record<string, unknown> = {}) {
  return {
    attempts: 1,
    availableAt: now,
    completedAt: null,
    createdAt: now,
    id: 'b8f73ce3-8272-4691-bce8-dde03e6a9489',
    idempotencyKey: 'feedback.created:feedback-id',
    lastError: null,
    lockedAt: now,
    lockedBy: 'worker-1',
    maxAttempts: 10,
    payload: {feedbackId: 'f0cfe454-08e7-433c-95af-ddf49ee64a80'},
    status: 'PROCESSING',
    type: 'feedback.created',
    updatedAt: now,
    ...overrides,
  }
}

function configuredDispatcher(overrides: Record<string, unknown> = {}) {
  const store = {
    claim: vi.fn().mockResolvedValue(job(overrides)),
    complete: vi.fn().mockResolvedValue(true),
    findFeedback: vi.fn().mockResolvedValue({
      email: 'ada@example.com',
      message: '<script>unsafe</script> A real enquiry.',
      name: 'Ada',
      subject: 'Artwork enquiry',
    }),
    findInquiry: vi.fn().mockResolvedValue({
      brief: null,
      email: 'collector@example.com',
      locale: 'en',
      message: 'Please share the private viewing options.',
      name: 'Ada Collector',
      relatedArtworkTitle: 'Silent Steppe',
      subject: null,
      type: 'AVAILABILITY',
    }),
    findSubscriber: vi.fn().mockResolvedValue({
      email: 'ada@example.com',
      locale: 'en',
    }),
    retry: vi.fn().mockResolvedValue(true),
  }
  const mailer = {
    sendEmailVerification: vi.fn().mockResolvedValue({id: 'verify-id'}),
    sendFeedbackAcknowledgement: vi.fn().mockResolvedValue({id: 'ack-id'}),
    sendFeedbackNotification: vi.fn().mockResolvedValue({id: 'support-id'}),
    sendInquiryAcknowledgement: vi
      .fn()
      .mockResolvedValue({id: 'inquiry-ack-id'}),
    sendInquiryNotification: vi
      .fn()
      .mockResolvedValue({id: 'inquiry-support-id'}),
    sendNewsletterConfirmation: vi.fn().mockResolvedValue({id: 'confirm-id'}),
    sendNewsletterWelcome: vi.fn().mockResolvedValue({id: 'welcome-id'}),
    sendPasswordReset: vi.fn().mockResolvedValue({id: 'reset-id'}),
    sendStudioMagicLink: vi.fn().mockResolvedValue({id: 'studio-link-id'}),
  }
  const tokens = {
    decrypt: vi.fn().mockReturnValue('plain-token'),
    openStudioMagicLink: vi
      .fn()
      .mockReturnValue(
        'https://bekten.art/api/auth/callback/email?token=plain-studio-token',
      ),
  }
  const dispatcher = createOutboxDispatcher(store, mailer, tokens, {
    appUrl: 'https://bekten.art',
    now: () => now,
    workerId: 'worker-1',
  })

  return {dispatcher, mailer, store, tokens}
}

describe('outbox dispatcher', () => {
  it('delivers feedback to support and sends a retry-safe acknowledgement', async () => {
    const {dispatcher, mailer, store} = configuredDispatcher()

    await expect(dispatcher.dispatchOne()).resolves.toEqual({
      status: 'completed',
    })

    expect(mailer.sendFeedbackNotification).toHaveBeenCalledWith(
      expect.objectContaining({replyTo: 'ada@example.com'}),
    )
    expect(mailer.sendFeedbackAcknowledgement).toHaveBeenCalledWith(
      expect.objectContaining({to: 'ada@example.com'}),
    )
    expect(mailer.sendFeedbackNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'feedback.created:feedback-id:support',
      }),
    )
    expect(store.complete).toHaveBeenCalledWith(job().id, 'worker-1', now)
  })

  it('builds a same-origin newsletter confirmation URL from an encrypted token', async () => {
    const {dispatcher, mailer, tokens} = configuredDispatcher({
      idempotencyKey: `newsletter.confirmation:${'a'.repeat(64)}`,
      payload: {
        confirmationTokenEncrypted: 'encrypted-confirmation-token',
        subscriberId: 'f0cfe454-08e7-433c-95af-ddf49ee64a80',
      },
      type: 'newsletter.confirmation_requested',
    })

    await dispatcher.dispatchOne()

    expect(tokens.decrypt).toHaveBeenCalledWith('encrypted-confirmation-token')
    expect(mailer.sendNewsletterConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmationUrl:
          'https://bekten.art/api/newsletter/confirm?token=plain-token&locale=en',
        idempotencyKey: `newsletter.confirmation:${'a'.repeat(64)}`,
      }),
    )
  })

  it('delivers a premium inquiry to support and acknowledges the collector idempotently', async () => {
    const inquiryId = 'f0cfe454-08e7-433c-95af-ddf49ee64a80'
    const {dispatcher, mailer, store} = configuredDispatcher({
      idempotencyKey: `inquiry.created:${inquiryId}`,
      payload: {inquiryId, locale: 'en', type: 'AVAILABILITY'},
      type: 'inquiry.created',
    })

    await expect(dispatcher.dispatchOne()).resolves.toEqual({
      status: 'completed',
    })
    expect(store.findInquiry).toHaveBeenCalledWith(inquiryId)
    expect(mailer.sendInquiryNotification).toHaveBeenCalledWith({
      idempotencyKey: `inquiry.created:${inquiryId}:support`,
      inquiry: expect.objectContaining({type: 'AVAILABILITY'}),
      replyTo: 'collector@example.com',
    })
    expect(mailer.sendInquiryAcknowledgement).toHaveBeenCalledWith({
      idempotencyKey: `inquiry.created:${inquiryId}:acknowledgement`,
      locale: 'en',
      name: 'Ada Collector',
      to: 'collector@example.com',
      type: 'AVAILABILITY',
    })
  })

  it('delivers a collector inquiry without collapsing it into a general inquiry', async () => {
    const inquiryId = 'f0cfe454-08e7-433c-95af-ddf49ee64a80'
    const {dispatcher, mailer, store} = configuredDispatcher({
      idempotencyKey: `inquiry.created:${inquiryId}`,
      payload: {inquiryId, locale: 'en', type: 'COLLECTOR'},
      type: 'inquiry.created',
    })

    store.findInquiry.mockResolvedValueOnce({
      brief: null,
      email: 'collector@example.com',
      locale: 'en',
      message: 'I would like to discuss building a collection.',
      name: 'Ada Collector',
      relatedArtworkTitle: null,
      subject: 'Collection advisory',
      type: 'COLLECTOR',
    })

    await expect(dispatcher.dispatchOne()).resolves.toEqual({
      status: 'completed',
    })
    expect(mailer.sendInquiryNotification).toHaveBeenCalledWith({
      idempotencyKey: `inquiry.created:${inquiryId}:support`,
      inquiry: expect.objectContaining({type: 'COLLECTOR'}),
      replyTo: 'collector@example.com',
    })
    expect(mailer.sendInquiryAcknowledgement).toHaveBeenCalledWith(
      expect.objectContaining({type: 'COLLECTOR'}),
    )
  })

  it('terminally rejects a malformed persisted inquiry without calling Resend', async () => {
    const inquiryId = 'f0cfe454-08e7-433c-95af-ddf49ee64a80'
    const {dispatcher, mailer, store} = configuredDispatcher({
      idempotencyKey: `inquiry.created:${inquiryId}`,
      payload: {inquiryId, locale: 'en', type: 'AVAILABILITY'},
      type: 'inquiry.created',
    })

    store.findInquiry.mockResolvedValueOnce({
      email: 'not-an-email',
      locale: 'en',
      name: '',
      type: 'AVAILABILITY',
    })

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'failed'})
    expect(mailer.sendInquiryNotification).not.toHaveBeenCalled()
    expect(store.retry).toHaveBeenCalledWith(
      job().id,
      'worker-1',
      expect.objectContaining({
        error: 'OUTBOX_PAYLOAD_INVALID',
        terminal: true,
      }),
    )
  })

  it('requeues transient failures with bounded exponential backoff and no secret detail', async () => {
    const {dispatcher, mailer, store} = configuredDispatcher()

    mailer.sendFeedbackNotification.mockRejectedValueOnce(
      new Error('secret provider response'),
    )

    await expect(dispatcher.dispatchOne()).resolves.toEqual({
      status: 'retrying',
    })
    expect(store.retry).toHaveBeenCalledWith(
      job().id,
      'worker-1',
      expect.objectContaining({
        availableAt: new Date('2026-08-09T12:00:30.000Z'),
        error: 'EMAIL_DELIVERY_FAILED',
        terminal: false,
      }),
    )
  })

  it('fails malformed jobs without attempting delivery', async () => {
    const {dispatcher, mailer, store} = configuredDispatcher({
      attempts: 10,
      payload: {feedbackId: 'not-a-uuid'},
    })

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'failed'})
    expect(mailer.sendFeedbackNotification).not.toHaveBeenCalled()
    expect(store.retry).toHaveBeenCalledWith(
      job().id,
      'worker-1',
      expect.objectContaining({
        error: 'OUTBOX_PAYLOAD_INVALID',
        terminal: true,
      }),
    )
  })

  it('terminally fails a claimed row whose database shape is malformed', async () => {
    const {dispatcher, mailer, store} = configuredDispatcher({
      attempts: 'corrupt-attempt-count',
    })

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'failed'})
    expect(mailer.sendFeedbackNotification).not.toHaveBeenCalled()
    expect(store.retry).toHaveBeenCalledWith(
      job().id,
      'worker-1',
      expect.objectContaining({
        error: 'OUTBOX_PAYLOAD_INVALID',
        terminal: true,
      }),
    )
  })

  it('reports idle without mutating when no due job can be claimed', async () => {
    const {dispatcher, store} = configuredDispatcher()

    store.claim.mockResolvedValueOnce(null)

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'idle'})
    expect(store.complete).not.toHaveBeenCalled()
    expect(store.retry).not.toHaveBeenCalled()
  })

  it('sends newsletter welcome mail with a fixed same-origin unsubscribe URL', async () => {
    const {dispatcher, mailer} = configuredDispatcher({
      idempotencyKey: 'newsletter.welcome:hash',
      payload: {
        subscriberId: 'f0cfe454-08e7-433c-95af-ddf49ee64a80',
        unsubscribeTokenEncrypted: 'encrypted-unsubscribe-token',
      },
      type: 'newsletter.welcome',
    })

    await expect(dispatcher.dispatchOne()).resolves.toEqual({
      status: 'completed',
    })
    expect(mailer.sendNewsletterWelcome).toHaveBeenCalledWith({
      idempotencyKey: 'newsletter.welcome:hash',
      locale: 'en',
      to: 'ada@example.com',
      unsubscribeUrl:
        'https://bekten.art/api/newsletter/unsubscribe?token=plain-token&locale=en',
    })
  })

  it('decrypts and delivers a same-origin Studio magic link without persisting plaintext', async () => {
    const {dispatcher, mailer, tokens} = configuredDispatcher({
      idempotencyKey: `studio.magic-link:${'a'.repeat(64)}`,
      payload: {
        expiresAt: '2026-08-10T12:10:00.000Z',
        signInUrlEncrypted: 'v1.nonce.ciphertext.authentication-tag',
        to: 'owner@example.com',
      },
      type: 'studio.magic-link.requested',
    })

    await expect(dispatcher.dispatchOne()).resolves.toEqual({
      status: 'completed',
    })
    expect(tokens.openStudioMagicLink).toHaveBeenCalledWith(
      'v1.nonce.ciphertext.authentication-tag',
    )
    expect(mailer.sendStudioMagicLink).toHaveBeenCalledWith({
      expiresAt: new Date('2026-08-10T12:10:00.000Z'),
      idempotencyKey: `studio.magic-link:${'a'.repeat(64)}`,
      signInUrl:
        'https://bekten.art/api/auth/callback/email?token=plain-studio-token',
      to: 'owner@example.com',
    })
    expect(JSON.stringify(mailer.sendStudioMagicLink.mock.calls)).not.toContain(
      'v1.nonce.ciphertext.authentication-tag',
    )
  })

  it('fails an unsupported job type permanently', async () => {
    const {dispatcher, store} = configuredDispatcher({type: 'unknown.job'})

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'failed'})
    expect(store.retry).toHaveBeenCalledWith(
      job().id,
      'worker-1',
      expect.objectContaining({
        error: 'OUTBOX_PAYLOAD_INVALID',
        terminal: true,
      }),
    )
  })

  it.each([
    {
      payload: {
        locale: 'en',
        name: 'Artist',
        to: 'artist@example.com',
        verificationUrlEncrypted: 'v1.encrypted.verification.envelope',
      },
      type: 'auth.email_verification',
    },
    {
      payload: {
        locale: 'en',
        name: 'Artist',
        resetUrlEncrypted: 'v1.encrypted.password-reset.envelope',
        to: 'artist@example.com',
      },
      type: 'auth.password_reset',
    },
  ])('terminally rejects the retired $type job', async retiredJob => {
    const {dispatcher, mailer, store, tokens} = configuredDispatcher(retiredJob)

    tokens.decrypt.mockReturnValueOnce(
      retiredJob.type === 'auth.email_verification'
        ? 'https://bekten.art/api/auth/verify-email?token=plain-token'
        : 'https://bekten.art/en/reset-password?token=plain-token',
    )

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'failed'})
    expect(tokens.decrypt).not.toHaveBeenCalled()
    expect(mailer.sendEmailVerification).not.toHaveBeenCalled()
    expect(mailer.sendPasswordReset).not.toHaveBeenCalled()
    expect(store.retry).toHaveBeenCalledWith(
      job().id,
      'worker-1',
      expect.objectContaining({
        error: 'OUTBOX_PAYLOAD_INVALID',
        terminal: true,
      }),
    )
  })

  it('dispatches a bounded batch and stops as soon as the queue is idle', async () => {
    const {dispatcher, store} = configuredDispatcher()

    store.claim
      .mockResolvedValueOnce(job())
      .mockResolvedValueOnce(
        job({
          id: 'aa5de1ea-50e0-4bd2-8b16-004cf6348b43',
        }),
      )
      .mockResolvedValueOnce(null)

    await expect(dispatcher.dispatchBatch(10)).resolves.toEqual({
      completed: 2,
      failed: 0,
      retrying: 0,
    })
  })
})
