import {describe, expect, it} from 'vitest'

import {buildContentSecurityPolicy} from './content-security-policy'

describe('buildContentSecurityPolicy', () => {
  it('builds a nonce-based production policy for the required first-party integrations', () => {
    const policy = buildContentSecurityPolicy({
      nonce: 'nonce-value',
      production: true,
    })

    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("script-src 'self' 'nonce-nonce-value' 'strict-dynamic'")
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'")
    expect(policy).toContain('https://www.googletagmanager.com')
    expect(policy).toContain('https://www.google-analytics.com')
    expect(policy).toContain('https://www.youtube-nocookie.com')
    expect(policy).toContain('https://www.google.com')
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).toContain('upgrade-insecure-requests')
    expect(policy).not.toMatch(/[\r\n]/)
  })

  it('rejects malformed nonce values instead of weakening the policy', () => {
    expect(() =>
      buildContentSecurityPolicy({nonce: "bad'; script-src *", production: true}),
    ).toThrow('Invalid CSP nonce')
  })

  it('does not upgrade localhost requests in development', () => {
    expect(
      buildContentSecurityPolicy({nonce: 'local-nonce', production: false}),
    ).not.toContain('upgrade-insecure-requests')
  })

  it('allows only the validated Garage origin for redirected public media', () => {
    const policy = buildContentSecurityPolicy({
      mediaOrigin: 'https://s3.mucahid.dev',
      nonce: 'media-nonce',
      production: true,
    })

    expect(policy).toMatch(
      /img-src[^;]+https:\/\/s3\.mucahid\.dev(?:;|$)/u,
    )
    expect(() =>
      buildContentSecurityPolicy({
        mediaOrigin: "https://s3.example'; img-src *",
        nonce: 'media-nonce',
        production: true,
      }),
    ).toThrow('Invalid media origin')
  })

  it('allows a localhost Garage origin during development', () => {
    const policy = buildContentSecurityPolicy({
      mediaOrigin: 'http://localhost:9000',
      nonce: 'local-media-nonce',
      production: false,
    })

    expect(policy).toMatch(/img-src[^;]+http:\/\/localhost:9000(?:;|$)/u)
  })

  it('rejects an insecure localhost Garage origin in production', () => {
    expect(() =>
      buildContentSecurityPolicy({
        mediaOrigin: 'http://localhost:9000',
        nonce: 'production-media-nonce',
        production: true,
      }),
    ).toThrow('Invalid media origin')
  })
})
