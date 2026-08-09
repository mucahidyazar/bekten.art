import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  subscribe: vi.fn(),
}))

vi.mock('@/server/auth/configured-rate-limit', () => ({
  consumeConfiguredRateLimit: mocks.consumeRateLimit,
}))
vi.mock('@/server/email/configured-newsletter-service', () => ({
  getConfiguredNewsletterService: () => ({subscribe: mocks.subscribe}),
}))

import {POST} from './route'

function request(body: unknown, origin = 'https://bekten.art') {
  return new Request('https://bekten.art/api/newsletter', {
    body: JSON.stringify(body),
    headers: {'content-type': 'application/json', origin},
    method: 'POST',
  })
}

const validBody = {
  consent: true,
  email: 'ada@example.com',
  locale: 'tr',
  source: 'homepage',
  website: '',
}

describe('POST /api/newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 2,
      retryAfterSeconds: 0,
    })
    mocks.subscribe.mockResolvedValue({accepted: true})
  })

  it('requires same-origin explicit-consent JSON', async () => {
    const crossOrigin = await POST(request(validBody, 'https://attacker.example'))
    const missingConsent = await POST(request({...validBody, consent: false}))

    expect(crossOrigin.status).toBe(403)
    expect(missingConsent.status).toBe(400)
    expect(mocks.subscribe).not.toHaveBeenCalled()
  })

  it('returns a generic accepted response and queues double opt-in', async () => {
    const response = await POST(request(validBody))

    expect(response.status).toBe(202)
    expect(mocks.subscribe).toHaveBeenCalledWith({
      consent: true,
      email: 'ada@example.com',
      locale: 'tr',
      source: 'homepage',
    })
    expect(await response.json()).toEqual({
      message: 'Check your inbox to confirm your subscription.',
      success: true,
    })
  })

  it('rate-limits by both network address and normalized email', async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 120,
    })

    const response = await POST(request(validBody))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('120')
    expect(mocks.consumeRateLimit).toHaveBeenCalledTimes(1)
    expect(mocks.subscribe).not.toHaveBeenCalled()
  })
})
