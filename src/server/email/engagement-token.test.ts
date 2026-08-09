import {describe, expect, it} from 'vitest'

import {createEngagementTokens} from './engagement-token'

describe('encrypted engagement tokens', () => {
  it('rejects weak encryption configuration', () => {
    expect(() => createEngagementTokens('too-short')).toThrow(
      'ENGAGEMENT_TOKEN_CONFIGURATION_INVALID',
    )
  })

  it('round-trips an opaque random token without storing it in plaintext', () => {
    const tokens = createEngagementTokens('a'.repeat(64))
    const created = tokens.create()

    expect(created.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(created.encrypted).not.toContain(created.plain)
    expect(tokens.decrypt(created.encrypted)).toBe(created.plain)
    expect(tokens.hash(created.plain)).toBe(created.hash)
  })

  it('encrypts an existing secret URL for durable outbox storage', () => {
    const tokens = createEngagementTokens('a'.repeat(64))
    const secretUrl =
      'https://bekten.art/api/auth/verify-email?token=raw-secret-token'
    const encrypted = tokens.encrypt(secretUrl)

    expect(encrypted).not.toContain(secretUrl)
    expect(tokens.decrypt(encrypted)).toBe(secretUrl)
  })

  it('fails closed when ciphertext authentication is modified', () => {
    const tokens = createEngagementTokens('a'.repeat(64))
    const created = tokens.create()
    const tampered = `${created.encrypted.slice(0, -1)}x`

    expect(() => tokens.decrypt(tampered)).toThrow('ENGAGEMENT_TOKEN_INVALID')
  })
})
