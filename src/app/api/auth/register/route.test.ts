import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  register: vi.fn(),
}))

vi.mock('@/server/auth/configured-email-verification', () => ({
  getConfiguredEmailVerificationService: () => ({register: mocks.register}),
}))
vi.mock('@/server/auth/configured-rate-limit', () => ({
  consumeConfiguredRateLimit: mocks.consumeRateLimit,
}))
vi.mock('@/server/auth/request-context', () => ({
  getClientAddress: () => '203.0.113.8',
  shouldTrustProxy: () => true,
}))
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import {POST} from './route'

function registrationRequest(origin?: string) {
  return new Request('https://bekten.art/api/auth/register', {
    body: JSON.stringify({
      email: 'artist@example.com',
      name: 'Artist',
      password: 'correct horse battery staple',
    }),
    headers: {
      'content-type': 'application/json',
      ...(origin ? {origin} : {}),
    },
    method: 'POST',
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 0,
    })
    mocks.register.mockResolvedValue({accepted: true})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects a cross-origin or missing-origin mutation before database work', async () => {
    const response = await POST(registrationRequest())

    expect(response.status).toBe(403)
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('returns the same generic accepted response after registration', async () => {
    const response = await POST(registrationRequest('https://bekten.art'))

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({
      message: 'If the address can be registered, a verification email has been sent.',
      success: true,
    })
  })

  it('short-circuits on the network limit before creating an identity key', async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 60,
    })

    const response = await POST(registrationRequest('https://bekten.art'))

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(mocks.consumeRateLimit).toHaveBeenCalledTimes(1)
    expect(mocks.consumeRateLimit).not.toHaveBeenCalledWith(
      expect.objectContaining({action: 'register_identity'}),
    )
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it.each([
    ['text/plain', undefined],
    ['application/json', String(16 * 1_024 + 1)],
  ])('rejects invalid request metadata', async (contentType, contentLength) => {
    const request = registrationRequest('https://bekten.art')

    request.headers.set('content-type', contentType)

    if (contentLength) {
      request.headers.set('content-length', contentLength)
    }

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON as a client error', async () => {
    const request = new Request('https://bekten.art/api/auth/register', {
      body: '{not-json',
      headers: {
        'content-type': 'application/json',
        origin: 'https://bekten.art',
      },
      method: 'POST',
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
  })

  it('enforces the body limit even when content-length is absent', async () => {
    const request = new Request('https://bekten.art/api/auth/register', {
      body: JSON.stringify({padding: 'x'.repeat(16 * 1_024)}),
      headers: {
        'content-type': 'application/json',
        origin: 'https://bekten.art',
      },
      method: 'POST',
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
  })

  it('maps invalid service input to a safe 400 response', async () => {
    mocks.register.mockRejectedValue(new Error('REGISTRATION_INPUT_INVALID'))

    const response = await POST(registrationRequest('https://bekten.art'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid registration request',
      success: false,
    })
  })

  it('keeps the enumeration-safe response when email delivery is unavailable', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    mocks.register.mockRejectedValue(new Error('EMAIL_DELIVERY_FAILED'))

    const response = await POST(registrationRequest('https://bekten.art'))

    expect(response.status).toBe(202)
    expect(consoleError).toHaveBeenCalledWith(
      'Email verification delivery is temporarily unavailable',
    )
  })

  it('maps unexpected failures without leaking their detail', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    mocks.register.mockRejectedValue(new Error('database secret detail'))

    const response = await POST(registrationRequest('https://bekten.art'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to process registration',
      success: false,
    })
    expect(consoleError).toHaveBeenCalledWith('Registration request failed')
  })

  it('fails closed when the canonical application URL is absent', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    vi.stubEnv('NEXTAUTH_URL', '')

    const response = await POST(registrationRequest('https://bekten.art'))

    expect(response.status).toBe(500)
    expect(mocks.register).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith('Registration request failed')
  })
})
