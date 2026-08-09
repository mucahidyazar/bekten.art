import {describe, expect, it, vi} from 'vitest'

import {createAuthEmailOutbox} from './auth-email-outbox'

describe('auth email outbox', () => {
  it('encrypts a verification URL and persists a retry-safe job without the raw token', async () => {
    const create = vi.fn().mockResolvedValue({id: 'job-id'})
    const encrypt = vi.fn().mockReturnValue('v1.encrypted.verification.envelope')
    const outbox = createAuthEmailOutbox({create}, {encrypt})
    const verificationUrl =
      'https://bekten.art/api/auth/verify-email?token=raw-secret-token'

    await outbox.enqueueVerification({
      idempotencyKey: `verify-email:${'a'.repeat(64)}`,
      name: 'Artist',
      to: 'artist@example.com',
      verificationUrl,
    })

    expect(encrypt).toHaveBeenCalledWith(verificationUrl)
    expect(create).toHaveBeenCalledWith({
      data: {
        idempotencyKey: `verify-email:${'a'.repeat(64)}`,
        payload: {
          locale: 'en',
          name: 'Artist',
          to: 'artist@example.com',
          verificationUrlEncrypted: 'v1.encrypted.verification.envelope',
        },
        type: 'auth.email_verification',
      },
    })
    expect(JSON.stringify(create.mock.calls)).not.toContain('raw-secret-token')
  })

  it('persists an encrypted localized password-reset job', async () => {
    const create = vi.fn().mockResolvedValue({id: 'job-id'})
    const outbox = createAuthEmailOutbox(
      {create},
      {encrypt: vi.fn().mockReturnValue('v1.encrypted.reset.envelope')},
    )

    await outbox.enqueuePasswordReset({
      idempotencyKey: `password-reset:${'b'.repeat(64)}`,
      locale: 'tr',
      name: null,
      resetUrl: 'https://bekten.art/tr/reset-password?token=raw-secret-token',
      to: 'artist@example.com',
    })

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: `password-reset:${'b'.repeat(64)}`,
        payload: expect.objectContaining({
          locale: 'tr',
          resetUrlEncrypted: 'v1.encrypted.reset.envelope',
        }),
        type: 'auth.password_reset',
      }),
    })
    expect(JSON.stringify(create.mock.calls)).not.toContain('raw-secret-token')
  })
})
