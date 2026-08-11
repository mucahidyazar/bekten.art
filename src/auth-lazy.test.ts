import {describe, expect, it, vi} from 'vitest'

vi.stubEnv('AUTH_SECRET', '')
vi.stubEnv('NEXTAUTH_SECRET', '')
vi.stubEnv('NODE_ENV', 'production')

describe('Studio authentication configuration boundary', () => {
  it('keeps module discovery build-safe and validates secrets only at runtime', async () => {
    const authentication = await import('./auth')

    expect(authentication.getAuthOptions).toBeTypeOf('function')
    expect(() => authentication.getAuthOptions()).toThrow(
      'A 32+ character authentication secret is required',
    )
  })
})
