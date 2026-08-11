import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  submit: vi.fn(),
}))

vi.mock('@/server/auth/configured-rate-limit', () => ({
  consumeConfiguredRateLimit: mocks.consumeRateLimit,
}))
vi.mock('@/server/inquiries/configured-inquiry-service', () => ({
  configuredInquiryService: {submit: mocks.submit},
}))

import {POST} from './route'

const submissionId = '123e4567-e89b-42d3-a456-426614174000'
const artworkId = '123e4567-e89b-42d3-a456-426614174001'
const validBody = {
  consent: true,
  email: 'collector@example.com',
  locale: 'en',
  message: 'Please share the viewing options for this work.',
  name: 'Ada Collector',
  relatedArtworkId: artworkId,
  submissionId,
  type: 'AVAILABILITY',
  website: '',
}

function request(body: unknown, origin = 'https://bekten.art') {
  return new Request('https://bekten.art/api/inquiries', {
    body: JSON.stringify(body),
    headers: {'content-type': 'application/json', origin},
    method: 'POST',
  })
}

describe('POST /api/inquiries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AUTH_SECRET', 'a'.repeat(64))
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 0,
    })
    mocks.submit.mockResolvedValue({accepted: true})
  })

  it('rejects cross-origin requests before parsing or persistence', async () => {
    const response = await POST(request(validBody, 'https://attacker.example'))

    expect(response.status).toBe(403)
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
    expect(mocks.submit).not.toHaveBeenCalled()
  })

  it('returns a bounded validation response for invalid inquiry fields', async () => {
    const response = await POST(request({...validBody, consent: false}))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Invalid inquiry request',
      success: false,
    })
    expect(mocks.submit).not.toHaveBeenCalled()
  })

  it('silently accepts the honeypot without creating abuse buckets', async () => {
    const response = await POST(
      request({...validBody, website: 'https://spam.example'}),
    )

    expect(response.status).toBe(202)
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
    expect(mocks.submit).not.toHaveBeenCalled()
  })

  it('short-circuits identity storage when the network bucket is exhausted', async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 120,
    })

    const response = await POST(request(validBody))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('120')
    expect(mocks.consumeRateLimit).toHaveBeenCalledTimes(1)
    expect(mocks.submit).not.toHaveBeenCalled()
  })

  it('submits normalized input with only a server-owned abuse hash', async () => {
    const response = await POST(
      request({...validBody, email: '  COLLECTOR@EXAMPLE.COM '}),
    )

    expect(response.status).toBe(202)
    expect(mocks.consumeRateLimit).toHaveBeenNthCalledWith(1, {
      action: 'inquiry_network',
      identifier: 'unavailable',
      policy: {limit: 5, windowMs: 3_600_000},
    })
    expect(mocks.consumeRateLimit).toHaveBeenNthCalledWith(2, {
      action: 'inquiry_identity',
      identifier: 'collector@example.com',
      policy: {limit: 3, windowMs: 3_600_000},
    })
    expect(mocks.submit).toHaveBeenCalledWith(
      expect.not.objectContaining({website: expect.anything()}),
      {
        abuseKeyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        source: 'WEBSITE',
      },
    )
    expect(await response.json()).toEqual({
      message: 'Your private request has been received.',
      success: true,
    })
  })

  it('returns retry-after when the identity bucket is exhausted', async () => {
    mocks.consumeRateLimit
      .mockResolvedValueOnce({allowed: true, remaining: 4, retryAfterSeconds: 0})
      .mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 90,
      })

    const response = await POST(request(validBody))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('90')
    expect(mocks.submit).not.toHaveBeenCalled()
  })

  it('does not leak infrastructure failures', async () => {
    mocks.submit.mockRejectedValueOnce(
      new Error('postgresql://private-user:private-password@database'),
    )

    const response = await POST(request(validBody))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Unable to receive your inquiry',
      success: false,
    })
  })
})
