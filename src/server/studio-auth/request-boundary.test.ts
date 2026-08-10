import {describe, expect, it, vi} from 'vitest'

import {guardStudioMagicLinkRequest} from './request-boundary'

function request(origin = 'https://bekten.art') {
  return new Request('https://bekten.art/api/auth/signin/email', {
    body: new URLSearchParams({email: 'Editor@Example.com'}),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin,
    },
    method: 'POST',
  })
}

function dependencies() {
  return {
    appOrigin: 'https://bekten.art',
    consumeRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 2,
      retryAfterSeconds: 0,
    }),
    networkIdentifier: '203.0.113.10',
  }
}

describe('Studio magic-link request boundary', () => {
  it('requires an exact same-origin mutation', async () => {
    const deps = dependencies()

    const result = await guardStudioMagicLinkRequest(
      request('https://attacker.example'),
      deps,
    )

    expect(result.allowed).toBe(false)
    expect(result.response?.status).toBe(403)
    expect(deps.consumeRateLimit).not.toHaveBeenCalled()
  })

  it('consumes DB-backed network and normalized identity limits', async () => {
    const deps = dependencies()

    await expect(
      guardStudioMagicLinkRequest(request(), deps),
    ).resolves.toMatchObject({allowed: true})
    expect(deps.consumeRateLimit).toHaveBeenNthCalledWith(1, {
      action: 'studio_magic_link_network',
      identifier: '203.0.113.10',
      policy: {limit: 5, windowMs: 900_000},
    })
    expect(deps.consumeRateLimit).toHaveBeenNthCalledWith(2, {
      action: 'studio_magic_link_identity',
      identifier: 'editor@example.com',
      policy: {limit: 3, windowMs: 900_000},
    })
  })

  it('returns a bounded generic rate-limit response without exposing an account result', async () => {
    const deps = dependencies()

    deps.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 120,
    })

    const result = await guardStudioMagicLinkRequest(request(), deps)

    expect(result.allowed).toBe(false)
    expect(result.response?.status).toBe(429)
    expect(await result.response?.json()).toEqual({
      error: 'Too many requests. Please try again later.',
      success: false,
    })
    expect(result.response?.headers.get('retry-after')).toBe('120')
  })
})
