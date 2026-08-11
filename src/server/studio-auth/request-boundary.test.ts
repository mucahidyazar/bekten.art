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
  it('rejects an oversized request before parsing identity or consuming rate limits', async () => {
    const deps = dependencies()
    const oversizedRequest = new Request(
      'https://bekten.art/api/auth/signin/email',
      {
        body: new URLSearchParams({email: `${'a'.repeat(20_000)}@example.com`}),
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          origin: 'https://bekten.art',
        },
        method: 'POST',
      },
    )

    const result = await guardStudioMagicLinkRequest(oversizedRequest, deps)

    expect(result.allowed).toBe(false)
    if (result.allowed) throw new Error('Expected the request to be rejected')

    expect(result.response.status).toBe(413)
    expect(deps.consumeRateLimit).not.toHaveBeenCalled()
  })

  it('rejects encoded or unsupported bodies before parsing them', async () => {
    const deps = dependencies()
    const encodedRequest = new Request(
      'https://bekten.art/api/auth/signin/email',
      {
        body: 'compressed',
        headers: {
          'content-encoding': 'gzip',
          'content-type': 'application/x-www-form-urlencoded',
          origin: 'https://bekten.art',
        },
        method: 'POST',
      },
    )

    const result = await guardStudioMagicLinkRequest(encodedRequest, deps)

    expect(result.allowed).toBe(false)
    if (result.allowed) throw new Error('Expected the request to be rejected')

    expect(result.response.status).toBe(415)
    expect(deps.consumeRateLimit).not.toHaveBeenCalled()
  })

  it('requires an exact same-origin mutation', async () => {
    const deps = dependencies()

    const result = await guardStudioMagicLinkRequest(
      request('https://attacker.example'),
      deps,
    )

    expect(result.allowed).toBe(false)
    if (result.allowed) throw new Error('Expected the request to be rejected')

    expect(result.response.status).toBe(403)
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
    if (result.allowed) throw new Error('Expected the request to be rejected')

    expect(result.response.status).toBe(429)
    expect(await result.response.json()).toEqual({
      error: 'Too many requests. Please try again later.',
      success: false,
    })
    expect(result.response.headers.get('retry-after')).toBe('120')
    expect(deps.consumeRateLimit).toHaveBeenCalledTimes(1)
  })
})
