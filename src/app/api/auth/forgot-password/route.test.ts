import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  requestReset: vi.fn(),
}))

vi.mock('@/server/auth/configured-password-reset', () => ({
  getConfiguredPasswordResetService: () => ({request: mocks.requestReset}),
}))
vi.mock('@/server/auth/configured-rate-limit', () => ({
  consumeConfiguredRateLimit: mocks.consumeRateLimit,
}))
vi.mock('@/server/auth/request-context', () => ({
  getClientAddress: () => '203.0.113.5',
  shouldTrustProxy: () => false,
}))

import {POST} from './route'

function request(body: unknown, origin = 'https://bekten.art') {
  return new Request('https://bekten.art/api/auth/forgot-password', {
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json', Origin: origin},
    method: 'POST',
  })
}

describe('forgot password route', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.consumeRateLimit.mockReset().mockResolvedValue({allowed: true})
    mocks.requestReset.mockReset().mockResolvedValue({accepted: true})
  })

  it('returns a generic accepted response without exposing identity state', async () => {
    const response = await POST(
      request({email: 'visitor@example.com', locale: 'tr'}),
    )

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({
      message: 'If the account is eligible, a reset email has been sent.',
      success: true,
    })
    expect(mocks.requestReset).toHaveBeenCalledWith(
      {email: 'visitor@example.com', locale: 'tr'},
      'https://bekten.art',
    )
  })

  it('rejects cross-origin mutations before processing the identity', async () => {
    const response = await POST(
      request(
        {email: 'visitor@example.com', locale: 'en'},
        'https://evil.test',
      ),
    )

    expect(response.status).toBe(403)
    expect(mocks.requestReset).not.toHaveBeenCalled()
  })

  it('rejects malformed input and rate-limits abuse', async () => {
    mocks.requestReset.mockRejectedValueOnce(
      new Error('PASSWORD_RESET_INPUT_INVALID'),
    )
    expect((await POST(request({email: 'invalid'}))).status).toBe(400)

    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 120,
    })
    const limited = await POST(
      request({email: 'visitor@example.com', locale: 'en'}),
    )

    expect(limited.status).toBe(429)
    expect(limited.headers.get('Retry-After')).toBe('120')
  })

  it('keeps delivery failures generic to prevent account enumeration', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    mocks.requestReset.mockRejectedValueOnce(new Error('EMAIL_DELIVERY_FAILED'))

    const response = await POST(
      request({email: 'visitor@example.com', locale: 'en'}),
    )

    expect(response.status).toBe(202)
    expect(consoleError).toHaveBeenCalledWith(
      'Password reset delivery is temporarily unavailable',
    )
  })
})
