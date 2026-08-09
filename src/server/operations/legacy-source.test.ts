import {describe, expect, it} from 'vitest'

import {validateLegacySourceUrl} from '../../../scripts/lib/legacy-source.mjs'

describe('legacy PocketBase source URL', () => {
  it('accepts a credential-free public HTTPS origin and strips the admin path', () => {
    expect(
      validateLegacySourceUrl('https://legacy.example.com/_/', {
        allowPrivateHttp: false,
      }),
    ).toBe('https://legacy.example.com')
  })

  it('requires an explicit one-time exception for a private HTTP address', () => {
    expect(() =>
      validateLegacySourceUrl('http://192.168.50.130:45000/_/', {
        allowPrivateHttp: false,
      }),
    ).toThrow('POCKETBASE_URL must use HTTPS')

    expect(
      validateLegacySourceUrl('http://192.168.50.130:45000/_/', {
        allowPrivateHttp: true,
      }),
    ).toBe('http://192.168.50.130:45000')
  })

  it.each([
    'http://example.com',
    'http://169.254.169.254',
    'https://user:password@example.com',
    'https://example.com?token=secret',
  ])('rejects unsafe source URL %s', source => {
    expect(() =>
      validateLegacySourceUrl(source, {allowPrivateHttp: true}),
    ).toThrow()
  })
})
