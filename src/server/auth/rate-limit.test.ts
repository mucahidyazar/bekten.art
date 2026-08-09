import {describe, expect, it, vi} from 'vitest'

import {consumeRateLimit, createRateLimitKey} from './rate-limit'

const secret = 's'.repeat(32)

describe('authentication rate limiting', () => {
  it('hashes sensitive identifiers before persistence', () => {
    const key = createRateLimitKey('artist@example.com', secret)

    expect(key).toMatch(/^[a-f0-9]{64}$/)
    expect(key).not.toContain('artist@example.com')
    expect(createRateLimitKey('artist@example.com', secret)).toBe(key)
  })

  it('allows requests through the configured limit', async () => {
    const store = {
      consume: vi.fn().mockResolvedValue({
        attempts: 3,
        windowStart: new Date('2026-08-09T10:00:00.000Z'),
      }),
    }

    await expect(
      consumeRateLimit(
        {
          action: 'login_identity',
          identifier: 'artist@example.com',
          now: new Date('2026-08-09T10:01:00.000Z'),
          policy: {limit: 3, windowMs: 60_000},
          secret,
        },
        store,
      ),
    ).resolves.toMatchObject({allowed: true, remaining: 0})
  })

  it('returns retry metadata after the configured limit', async () => {
    const store = {
      consume: vi.fn().mockResolvedValue({
        attempts: 4,
        windowStart: new Date('2026-08-09T10:00:00.000Z'),
      }),
    }

    await expect(
      consumeRateLimit(
        {
          action: 'login_ip',
          identifier: '203.0.113.10',
          now: new Date('2026-08-09T10:00:30.000Z'),
          policy: {limit: 3, windowMs: 60_000},
          secret,
        },
        store,
      ),
    ).resolves.toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 30,
    })
  })

  it('rejects invalid policies and weak secrets before touching the store', async () => {
    const store = {consume: vi.fn()}

    await expect(
      consumeRateLimit(
        {
          action: 'LOGIN!',
          identifier: 'artist@example.com',
          policy: {limit: 0, windowMs: 60_000},
          secret: 'weak',
        },
        store,
      ),
    ).rejects.toThrow()
    expect(store.consume).not.toHaveBeenCalled()
  })
})
