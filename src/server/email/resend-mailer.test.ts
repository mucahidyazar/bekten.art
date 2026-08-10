import {describe, expect, it, vi} from 'vitest'

import {createResendMailer, getResendConfiguration} from './resend-mailer'

describe('Resend mailer', () => {
  it('exposes no retired public-account delivery methods', () => {
    const mailer = createResendMailer(
      {emails: {send: vi.fn()}},
      {
        apiKey: 're_bekten_key',
        from: 'Bekten Art <noreply@mucahid.dev>',
        replyTo: 'support@mucahid.dev',
      },
    )

    expect(mailer).not.toHaveProperty('sendEmailVerification')
    expect(mailer).not.toHaveProperty('sendPasswordReset')
  })

  it('creates a branded, server-only sender configuration', () => {
    expect(
      getResendConfiguration({
        RESEND_API_KEY: 're_bekten_key',
        RESEND_FROM_EMAIL: 'noreply@mucahid.dev',
        RESEND_REPLY_TO: 'support@mucahid.dev',
      }),
    ).toEqual({
      apiKey: 're_bekten_key',
      from: 'Bekten Art <noreply@mucahid.dev>',
      replyTo: 'support@mucahid.dev',
    })
  })

  it.each([
    [{RESEND_API_KEY: '', RESEND_FROM_EMAIL: 'noreply@mucahid.dev'}],
    [
      {
        RESEND_API_KEY: 'not-a-resend-key',
        RESEND_FROM_EMAIL: 'noreply@mucahid.dev',
      },
    ],
    [{RESEND_API_KEY: 're_bekten_key', RESEND_FROM_EMAIL: 'not-an-email'}],
    [
      {
        RESEND_API_KEY: 're_bekten_key',
        RESEND_FROM_EMAIL: 'noreply@mucahid.dev\r\nBcc: attacker@example.com',
      },
    ],
    [
      {
        RESEND_API_KEY: 're_bekten_key',
        RESEND_FROM_EMAIL: 'noreply@mucahid.dev',
        RESEND_REPLY_TO: 'not-an-email',
      },
    ],
  ])('rejects an invalid mail configuration', environment => {
    expect(() => getResendConfiguration(environment)).toThrow(
      'EMAIL_CONFIGURATION_INVALID',
    )
  })

  it('maps provider errors without leaking the provider message', async () => {
    const mailer = createResendMailer(
      {
        emails: {
          send: vi.fn().mockResolvedValue({
            data: null,
            error: {message: 'secret provider detail', name: 'restricted'},
          }),
        },
      },
      {
        apiKey: 're_bekten_key',
        from: 'Bekten Art <noreply@mucahid.dev>',
        replyTo: null,
      },
    )

    await expect(
      mailer.sendFeedbackAcknowledgement({
        idempotencyKey: 'feedback:user:acknowledgement',
        name: 'Ada',
        to: 'user@example.com',
      }),
    ).rejects.toThrow('EMAIL_DELIVERY_FAILED')
  })

  it('maps thrown provider failures to the same safe public error', async () => {
    const mailer = createResendMailer(
      {
        emails: {
          send: vi.fn().mockRejectedValue(new Error('secret transport detail')),
        },
      },
      {
        apiKey: 're_bekten_key',
        from: 'Bekten Art <noreply@mucahid.dev>',
        replyTo: null,
      },
    )

    await expect(
      mailer.sendFeedbackAcknowledgement({
        idempotencyKey: 'feedback:user:acknowledgement',
        name: '<script>alert(1)</script>',
        to: 'user@example.com',
      }),
    ).rejects.toThrow('EMAIL_DELIVERY_FAILED')
  })

  it('escapes untrusted feedback in both support and acknowledgement messages', async () => {
    const send = vi
      .fn()
      .mockResolvedValue({data: {id: 'email-id'}, error: null})
    const mailer = createResendMailer(
      {emails: {send}},
      {
        apiKey: 're_bekten_key',
        from: 'Bekten Art <noreply@mucahid.dev>',
        replyTo: 'support@mucahid.dev',
      },
    )

    await mailer.sendFeedbackNotification({
      idempotencyKey: 'feedback:1:support',
      message: '<img src=x onerror=alert(1)>',
      name: '<script>Ada</script>',
      replyTo: 'ada@example.com',
      subject: 'Artwork <question>',
    })
    await mailer.sendFeedbackAcknowledgement({
      idempotencyKey: 'feedback:1:acknowledgement',
      name: '<script>Ada</script>',
      to: 'ada@example.com',
    })

    expect(send).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        html: expect.not.stringContaining('<script>'),
        replyTo: 'ada@example.com',
        subject: expect.not.stringContaining('<question>'),
        to: ['support@mucahid.dev'],
      }),
      {idempotencyKey: 'feedback:1:support'},
    )
    expect(send).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        html: expect.not.stringContaining('<script>'),
        to: ['ada@example.com'],
      }),
      {idempotencyKey: 'feedback:1:acknowledgement'},
    )
  })

  it('sends localized newsletter confirmation and welcome links', async () => {
    const send = vi
      .fn()
      .mockResolvedValue({data: {id: 'email-id'}, error: null})
    const mailer = createResendMailer(
      {emails: {send}},
      {
        apiKey: 're_bekten_key',
        from: 'Bekten Art <noreply@mucahid.dev>',
        replyTo: 'support@mucahid.dev',
      },
    )

    await mailer.sendNewsletterConfirmation({
      confirmationUrl: 'https://bekten.art/api/newsletter/confirm?token=safe',
      idempotencyKey: 'newsletter:confirmation',
      locale: 'tr',
      to: 'ada@example.com',
    })
    await mailer.sendNewsletterWelcome({
      idempotencyKey: 'newsletter:welcome',
      locale: 'en',
      to: 'ada@example.com',
      unsubscribeUrl:
        'https://bekten.art/api/newsletter/unsubscribe?token=safe',
    })

    expect(send).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        html: expect.stringContaining('/api/newsletter/confirm?token=safe'),
        subject: expect.stringMatching(/aboneli/i),
      }),
      {idempotencyKey: 'newsletter:confirmation'},
    )
    expect(send).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: {
          'List-Unsubscribe':
            '<https://bekten.art/api/newsletter/unsubscribe?token=safe>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        html: expect.stringContaining('/api/newsletter/unsubscribe?token=safe'),
      }),
      {idempotencyKey: 'newsletter:welcome'},
    )
  })
})
