import {describe, expect, it} from 'vitest'

import {getOgAssetOrigin} from './og-origin'

describe('Open Graph asset origin', () => {
  it('uses the configured canonical HTTPS origin', () => {
    expect(
      getOgAssetOrigin({
        NEXT_PUBLIC_APP_URL: 'https://bekten.art',
        NODE_ENV: 'production',
      }),
    ).toBe('https://bekten.art')
  })

  it.each([
    undefined,
    'http://bekten.art',
    'https://user:password@bekten.art',
    'https://bekten.art/path',
  ])('rejects unsafe production origins: %s', candidate => {
    expect(() =>
      getOgAssetOrigin({
        NEXT_PUBLIC_APP_URL: candidate,
        NODE_ENV: 'production',
      }),
    ).toThrow('OG_ASSET_ORIGIN_INVALID')
  })

  it('allows only loopback HTTP during development', () => {
    expect(
      getOgAssetOrigin({
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development',
      }),
    ).toBe('http://localhost:3000')
    expect(() =>
      getOgAssetOrigin({
        NEXT_PUBLIC_APP_URL: 'http://attacker.example',
        NODE_ENV: 'development',
      }),
    ).toThrow('OG_ASSET_ORIGIN_INVALID')
  })
})
