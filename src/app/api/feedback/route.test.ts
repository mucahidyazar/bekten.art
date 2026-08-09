import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createFeedback: vi.fn(),
}))

vi.mock('@/server/auth/configured-rate-limit', () => ({
  consumeConfiguredRateLimit: mocks.consumeRateLimit,
}))
vi.mock('@/server/operations/database-operational-repository', () => ({
  operationalRepository: {createFeedback: mocks.createFeedback},
}))

import {POST} from './route'

function request(body: unknown, origin = 'https://bekten.art') {
  return new Request('https://bekten.art/api/feedback', {
    body: JSON.stringify(body),
    headers: {'content-type': 'application/json', origin},
    method: 'POST',
  })
}

const validBody = {
  email: 'ada@example.com',
  locale: 'en',
  message: 'I would like to ask about an original artwork.',
  name: 'Ada Lovelace',
  privacyAccepted: true,
  subject: 'Artwork enquiry',
  website: '',
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 0,
    })
    mocks.createFeedback.mockResolvedValue({id: 'feedback-id'})
  })

  it('rejects cross-origin requests before persistence', async () => {
    const response = await POST(request(validBody, 'https://attacker.example'))

    expect(response.status).toBe(403)
    expect(mocks.createFeedback).not.toHaveBeenCalled()
  })

  it('validates consent and message fields', async () => {
    const response = await POST(
      request({...validBody, message: 'short', privacyAccepted: false}),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Invalid contact request',
      success: false,
    })
    expect(mocks.createFeedback).not.toHaveBeenCalled()
  })

  it('persists accepted feedback with server-owned retention timestamps', async () => {
    const response = await POST(request(validBody))

    expect(response.status).toBe(202)
    expect(mocks.createFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        locale: 'en',
        privacyAcceptedAt: expect.any(Date),
        source: 'contact-form',
      }),
    )
    expect(await response.json()).toEqual({
      message: 'Your message has been received.',
      success: true,
    })
  })

  it('silently accepts a populated honeypot without storing or sending', async () => {
    const response = await POST(
      request({...validBody, website: 'https://spam.example'}),
    )

    expect(response.status).toBe(202)
    expect(mocks.createFeedback).not.toHaveBeenCalled()
  })

  it('returns retry-after when either abuse bucket is exhausted', async () => {
    mocks.consumeRateLimit
      .mockResolvedValueOnce({allowed: true, remaining: 0, retryAfterSeconds: 0})
      .mockResolvedValueOnce({allowed: false, remaining: 0, retryAfterSeconds: 90})

    const response = await POST(request(validBody))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('90')
    expect(mocks.createFeedback).not.toHaveBeenCalled()
  })

  it('does not create identity buckets after the network bucket is exhausted', async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 120,
    })

    const response = await POST(request(validBody))

    expect(response.status).toBe(429)
    expect(mocks.consumeRateLimit).toHaveBeenCalledTimes(1)
    expect(mocks.createFeedback).not.toHaveBeenCalled()
  })

  it('does not leak persistence failures', async () => {
    mocks.createFeedback.mockRejectedValueOnce(new Error('secret database detail'))

    const response = await POST(request(validBody))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Unable to receive your message',
      success: false,
    })
  })
})
