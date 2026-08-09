import {describe, expect, it} from 'vitest'

import {
  getClientAddress,
  getRequiredAuthSecret,
  shouldTrustProxy,
} from './request-context'

describe('auth request context', () => {
  it('accepts a valid proxy address only when the proxy is explicitly trusted', () => {
    const request = {
      headers: {'x-forwarded-for': '203.0.113.8, 10.0.0.2'},
    }

    expect(getClientAddress(request, false)).toBe('unavailable')
    expect(getClientAddress(request, true)).toBe('203.0.113.8')
  })

  it('rejects attacker-controlled non-IP forwarding values', () => {
    expect(
      getClientAddress(
        {headers: {'x-forwarded-for': 'victim@example.com'}},
        true,
      ),
    ).toBe('unavailable')
  })

  it('supports the standard Headers interface and x-real-ip fallback', () => {
    expect(
      getClientAddress(
        {headers: new Headers({'x-real-ip': '2001:db8::1'})},
        true,
      ),
    ).toBe('2001:db8::1')
  })

  it('returns a stable unavailable bucket when headers are absent', () => {
    expect(getClientAddress({}, true)).toBe('unavailable')
  })

  it('trusts forwarding headers only behind the explicitly configured proxy', () => {
    expect(shouldTrustProxy({AUTH_TRUST_PROXY: 'true'})).toBe(true)
    expect(shouldTrustProxy({AUTH_TRUST_PROXY: 'false'})).toBe(false)
    expect(shouldTrustProxy({})).toBe(false)
  })

  it('accepts either stable auth secret name and rejects weak secrets', () => {
    expect(getRequiredAuthSecret({NEXTAUTH_SECRET: 'n'.repeat(32)})).toBe(
      'n'.repeat(32),
    )
    expect(getRequiredAuthSecret({AUTH_SECRET: 'a'.repeat(32)})).toBe(
      'a'.repeat(32),
    )
    expect(() => getRequiredAuthSecret({AUTH_SECRET: 'weak'})).toThrow(
      '32+ character',
    )
  })
})
