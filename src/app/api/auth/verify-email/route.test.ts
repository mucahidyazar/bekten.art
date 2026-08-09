import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  verify: vi.fn(),
}))

vi.mock('@/server/auth/configured-email-verification', () => ({
  getConfiguredEmailVerificationService: () => ({verify: mocks.verify}),
}))
vi.mock('@/server/auth/configured-rate-limit', () => ({
  consumeConfiguredRateLimit: mocks.consumeRateLimit,
}))
vi.mock('@/server/auth/request-context', () => ({
  getClientAddress: () => '203.0.113.8',
  shouldTrustProxy: () => true,
}))

import {GET, POST} from './route'

const token = 'a'.repeat(43)

function mutation(origin = 'https://bekten.art', cookie = `bekten_email_verification=${token}`) {
  return new Request('https://bekten.art/api/auth/verify-email', {
    headers: {cookie, origin},
    method: 'POST',
  })
}

describe('/api/auth/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 29,
      retryAfterSeconds: 0,
    })
  })

  it('GET validates the token without consuming it and prepares a token-free UI', async () => {
    const response = await GET(
      new Request(`https://bekten.art/api/auth/verify-email?token=${token}`),
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'https://bekten.art/en/confirm-email-action?action=verify-email',
    )
    expect(response.headers.get('set-cookie')).toContain(
      `bekten_email_verification=${token}`,
    )
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(response.headers.get('set-cookie')).toContain('SameSite=strict')
    expect(mocks.verify).not.toHaveBeenCalled()
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
  })

  it('GET rejects malformed tokens without persisting them', async () => {
    const response = await GET(
      new Request('https://bekten.art/api/auth/verify-email?token=invalid'),
    )

    expect(response.headers.get('location')).toBe(
      'https://bekten.art/en/sign-in?error=verification',
    )
    expect(response.headers.get('set-cookie')).toBeNull()
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it('POST consumes a staged token and redirects to a generic success state', async () => {
    mocks.verify.mockResolvedValue(true)

    const response = await POST(mutation())

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'https://bekten.art/en/sign-in?verified=true',
    )
    expect(mocks.verify).toHaveBeenCalledWith(token)
    expect(response.headers.get('set-cookie')).toContain(
      'bekten_email_verification=;',
    )
  })

  it('POST is replay-safe and does not expose whether a token was already consumed', async () => {
    mocks.verify.mockResolvedValue(false)

    const response = await POST(mutation())

    expect(response.headers.get('location')).toBe(
      'https://bekten.art/en/sign-in?verified=true',
    )
  })

  it('POST rejects cross-origin mutations before token consumption', async () => {
    const response = await POST(mutation('https://evil.test'))

    expect(response.status).toBe(403)
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it('does not query tokens after the network limit is reached', async () => {
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 60,
    })

    const response = await POST(mutation())

    expect(response.status).toBe(429)
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it('maps infrastructure errors without logging the raw token', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    mocks.verify.mockRejectedValue(new Error(`secret:${token}`))

    const response = await POST(mutation())

    expect(response.headers.get('location')).toBe(
      'https://bekten.art/en/sign-in?error=verification',
    )
    expect(consoleError).toHaveBeenCalledWith('Email verification request failed')
  })
})
