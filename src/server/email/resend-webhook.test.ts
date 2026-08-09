import {describe, expect, it, vi} from 'vitest'

import {createResendWebhookService} from './resend-webhook'

const payload = JSON.stringify({
  created_at: '2026-08-09T12:00:00.000Z',
  data: {
    created_at: '2026-08-09T11:59:59.000Z',
    email_id: 'email-id',
    from: 'Bekten Art <noreply@mucahid.dev>',
    subject: 'Welcome',
    to: ['subscriber@example.com'],
  },
  type: 'email.bounced',
})

describe('Resend webhook service', () => {
  it('verifies the raw body and records a normalized suppression event', async () => {
    const verify = vi.fn().mockReturnValue(JSON.parse(payload))
    const record = vi.fn().mockResolvedValue({inserted: true, suppressed: 1})
    const service = createResendWebhookService({verify}, {record})

    await expect(
      service.handle({
        id: 'msg_unique_delivery',
        payload,
        signature: 'v1,signature',
        timestamp: '1786276800',
      }),
    ).resolves.toEqual({accepted: true})
    expect(verify).toHaveBeenCalledWith({
      headers: {
        id: 'msg_unique_delivery',
        signature: 'v1,signature',
        timestamp: '1786276800',
      },
      payload,
    })
    expect(record).toHaveBeenCalledWith({
      eventId: 'msg_unique_delivery',
      eventType: 'email.bounced',
      occurredAt: new Date('2026-08-09T12:00:00.000Z'),
      providerMessageId: 'email-id',
      recipients: ['subscriber@example.com'],
      suppressRecipients: true,
    })
  })

  it('suppresses complaints but records other email events without suppression', async () => {
    const event = JSON.parse(payload)

    event.type = 'email.delivered'
    const record = vi.fn().mockResolvedValue({inserted: true, suppressed: 0})
    const service = createResendWebhookService(
      {verify: vi.fn().mockReturnValue(event)},
      {record},
    )

    await service.handle({
      id: 'msg_delivered',
      payload,
      signature: 'v1,signature',
      timestamp: '1786276800',
    })

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({suppressRecipients: false}),
    )
  })

  it('rejects invalid headers and untrusted verifier failures', async () => {
    const service = createResendWebhookService(
      {verify: vi.fn(() => { throw new Error('bad signature') })},
      {record: vi.fn()},
    )

    await expect(
      service.handle({id: '', payload, signature: '', timestamp: ''}),
    ).rejects.toThrow('RESEND_WEBHOOK_INVALID')
  })
})
