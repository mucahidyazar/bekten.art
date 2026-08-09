import {beforeEach, describe, expect, it, vi} from 'vitest'

const handle = vi.hoisted(() => vi.fn())

vi.mock('@/server/email/configured-resend-webhook', () => ({
  getConfiguredResendWebhookService: () => ({handle}),
}))

import {POST} from './route'

describe('POST /api/email/webhook', () => {
  beforeEach(() => {
    handle.mockReset().mockResolvedValue({accepted: true})
  })

  it('passes the untouched payload and Svix headers to verification', async () => {
    const payload = '{"type":"email.delivered","data":{"email_id":"id"}}'
    const response = await POST(
      new Request('https://bekten.art/api/email/webhook', {
        body: payload,
        headers: {
          'svix-id': 'msg_unique',
          'svix-signature': 'v1,signature',
          'svix-timestamp': '1786276800',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(200)
    expect(handle).toHaveBeenCalledWith({
      id: 'msg_unique',
      payload,
      signature: 'v1,signature',
      timestamp: '1786276800',
    })
  })

  it('rejects invalid signatures and oversized payloads generically', async () => {
    handle.mockRejectedValueOnce(new Error('provider secret detail'))

    expect(
      (await POST(new Request('https://bekten.art/api/email/webhook', {body: '{}', method: 'POST'}))).status,
    ).toBe(400)

    expect(
      (
        await POST(
          new Request('https://bekten.art/api/email/webhook', {
            body: 'x'.repeat(256 * 1_024 + 1),
            method: 'POST',
          }),
        )
      ).status,
    ).toBe(413)
  })
})
