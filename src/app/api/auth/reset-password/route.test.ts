import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  resetPassword: vi.fn(),
}))

vi.mock('@/server/auth/configured-password-reset', () => ({
  getConfiguredPasswordResetService: () => ({reset: mocks.resetPassword}),
}))
vi.mock('@/server/auth/configured-rate-limit', () => ({
  consumeConfiguredRateLimit: mocks.consumeRateLimit,
}))
vi.mock('@/server/auth/request-context', () => ({
  getClientAddress: () => '203.0.113.5',
  shouldTrustProxy: () => false,
}))

import {POST} from './route'

const validBody = {
  password: 'a-new-password-with-entropy',
  token: 'r'.repeat(43),
}

function request(body: unknown, origin = 'https://bekten.art') {
  return new Request('https://bekten.art/api/auth/reset-password', {
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json', Origin: origin},
    method: 'POST',
  })
}

describe('reset password route', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.consumeRateLimit.mockReset().mockResolvedValue({allowed: true})
    mocks.resetPassword.mockReset().mockResolvedValue(true)
  })

  it('consumes a valid token and returns a non-cacheable success response', async () => {
    const response = await POST(request(validBody))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toContain('no-store')
    await expect(response.json()).resolves.toEqual({success: true})
  })

  it('returns the same invalid result for an unknown, expired or used token', async () => {
    mocks.resetPassword.mockResolvedValue(false)

    const response = await POST(request(validBody))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Reset link is invalid or expired.',
      success: false,
    })
  })

  it('rejects malformed and cross-origin reset attempts', async () => {
    mocks.resetPassword.mockRejectedValueOnce(
      new Error('PASSWORD_RESET_INPUT_INVALID'),
    )
    expect((await POST(request({token: 'invalid'}))).status).toBe(400)
    expect((await POST(request(validBody, 'https://evil.test'))).status).toBe(
      403,
    )
  })

  it('rate-limits repeated token attempts', async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 90,
    })

    const response = await POST(request(validBody))

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('90')
    expect(mocks.resetPassword).not.toHaveBeenCalled()
  })
})
