import {describe, expect, it} from 'vitest'

import {createStudioMagicLinkSealer} from './sealed-link'

describe('Studio magic-link AEAD envelope', () => {
  it('keeps the raw callback token out of persisted payloads and decrypts for delivery', () => {
    const sealer = createStudioMagicLinkSealer('a'.repeat(64))
    const url =
      'https://bekten.art/api/auth/callback/email?token=raw-secret-token'
    const envelope = sealer.seal(url)

    expect(envelope).not.toContain('raw-secret-token')
    expect(envelope).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u)
    expect(sealer.open(envelope)).toBe(url)
  })

  it('uses a random nonce so identical links have distinct ciphertext', () => {
    const sealer = createStudioMagicLinkSealer('a'.repeat(64))
    const url = 'https://bekten.art/api/auth/callback/email?token=secret'

    expect(sealer.seal(url)).not.toBe(sealer.seal(url))
  })

  it('rejects tampered or purpose-incompatible envelopes', () => {
    const sealer = createStudioMagicLinkSealer('a'.repeat(64))
    const otherSealer = createStudioMagicLinkSealer('b'.repeat(64))
    const envelope = sealer.seal(
      'https://bekten.art/api/auth/callback/email?token=secret',
    )

    expect(() => otherSealer.open(envelope)).toThrow(
      'STUDIO_MAGIC_LINK_INVALID',
    )
    expect(() => sealer.open(`${envelope}a`)).toThrow(
      'STUDIO_MAGIC_LINK_INVALID',
    )
  })

  it('rejects weak secrets', () => {
    expect(() => createStudioMagicLinkSealer('short')).toThrow(
      'STUDIO_MAGIC_LINK_CONFIGURATION_INVALID',
    )
  })
})
