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
    sendNewsletterConfirmation: vi.fn().mockResolvedValue({id: 'confirm-id'}),
    sendNewsletterWelcome: vi.fn().mockResolvedValue({id: 'welcome-id'}),
    sendPasswordReset: vi.fn().mockResolvedValue({id: 'reset-id'}),
  }
  const tokens = {decrypt: vi.fn().mockReturnValue('plain-token')}
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

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'completed'})

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

  it('requeues transient failures with bounded exponential backoff and no secret detail', async () => {
    const {dispatcher, mailer, store} = configuredDispatcher()

    mailer.sendFeedbackNotification.mockRejectedValueOnce(
      new Error('secret provider response'),
    )

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'retrying'})
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

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'completed'})
    expect(mailer.sendNewsletterWelcome).toHaveBeenCalledWith({
      idempotencyKey: 'newsletter.welcome:hash',
      locale: 'en',
      to: 'ada@example.com',
      unsubscribeUrl:
        'https://bekten.art/api/newsletter/unsubscribe?token=plain-token&locale=en',
    })
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

  it('delivers encrypted auth links without storing plaintext tokens in the job', async () => {
    const {dispatcher, mailer, tokens} = configuredDispatcher({
      idempotencyKey: `verify-email:${'a'.repeat(64)}`,
      payload: {
        locale: 'en',
        name: 'Artist',
        to: 'artist@example.com',
        verificationUrlEncrypted: 'v1.encrypted.verification.envelope',
      },
      type: 'auth.email_verification',
    })

    tokens.decrypt.mockReturnValueOnce(
      'https://bekten.art/api/auth/verify-email?token=plain-token',
    )

    await expect(dispatcher.dispatchOne()).resolves.toEqual({status: 'completed'})
    expect(mailer.sendEmailVerification).toHaveBeenCalledWith({
      idempotencyKey: `verify-email:${'a'.repeat(64)}`,
      locale: 'en',
      name: 'Artist',
      to: 'artist@example.com',
      verificationUrl:
        'https://bekten.art/api/auth/verify-email?token=plain-token',
    })
  })

  it('dispatches a bounded batch and stops as soon as the queue is idle', async () => {
    const {dispatcher, store} = configuredDispatcher()

    store.claim
      .mockResolvedValueOnce(job())
      .mockResolvedValueOnce(job({
        id: 'aa5de1ea-50e0-4bd2-8b16-004cf6348b43',
      }))
      .mockResolvedValueOnce(null)

    await expect(dispatcher.dispatchBatch(10)).resolves.toEqual({
      completed: 2,
      failed: 0,
      retrying: 0,
    })
  })
})
