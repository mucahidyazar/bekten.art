import {createHash} from 'node:crypto'

import {describe, expect, it, vi} from 'vitest'

import {
  createStudioMagicLinkCoordinator,
  hashStudioVerificationToken,
  normalizeStudioEmail,
} from './magic-link-coordinator'

const secret = 's'.repeat(48)
const rawToken = 'raw-token-that-must-never-be-persisted'
const identifier = 'editor@example.com'
const expires = new Date('2026-08-10T12:10:00.000Z')

function verificationToken() {
  return {
    expires,
    identifier,
    token: hashStudioVerificationToken(rawToken, secret),
  }
}

describe('Studio magic-link coordinator', () => {
  it('pairs NextAuth mail and adapter calls while storing only the token hash', async () => {
    const queue = vi.fn().mockResolvedValue({accepted: true})
    const coordinator = createStudioMagicLinkCoordinator({
      appOrigin: 'https://bekten.art',
      minimumDurationMs: 0,
      queue,
      sealSignInUrl: vi.fn().mockReturnValue('v1.sealed-link'),
      secret,
    })

    const mail = coordinator.queueMail({
      expires,
      identifier,
      token: rawToken,
      url: `https://bekten.art/api/auth/callback/email?token=${rawToken}`,
    })
    const token = coordinator.storeVerificationToken(verificationToken())

    await expect(Promise.all([mail, token])).resolves.toEqual([
      undefined,
      verificationToken(),
    ])
    expect(queue).toHaveBeenCalledOnce()
    expect(queue).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier,
        mail: expect.objectContaining({
          signInUrlEncrypted: 'v1.sealed-link',
        }),
        verification: expect.objectContaining({
          token: createHash('sha256')
            .update(`${rawToken}${secret}`)
            .digest('hex'),
        }),
      }),
    )
    expect(JSON.stringify(queue.mock.calls)).not.toContain(rawToken)
  })

  it('returns the same generic completion shape when the address is unknown', async () => {
    const queue = vi.fn().mockResolvedValue({accepted: false})
    const coordinator = createStudioMagicLinkCoordinator({
      appOrigin: 'https://bekten.art',
      minimumDurationMs: 0,
      queue,
      sealSignInUrl: vi.fn().mockReturnValue('v1.sealed-link'),
      secret,
    })

    const result = await Promise.all([
      coordinator.queueMail({
        expires,
        identifier,
        token: rawToken,
        url: `https://bekten.art/api/auth/callback/email?token=${rawToken}`,
      }),
      coordinator.storeVerificationToken(verificationToken()),
    ])

    expect(result).toEqual([undefined, verificationToken()])
  })

  it('pads both accepted and rejected requests to a minimum duration', async () => {
    const pause = vi.fn().mockResolvedValue(undefined)
    const monotonicNow = vi
      .fn<() => number>()
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(120)
    const coordinator = createStudioMagicLinkCoordinator({
      appOrigin: 'https://bekten.art',
      minimumDurationMs: 100,
      monotonicNow,
      pause,
      queue: vi.fn().mockResolvedValue({accepted: false}),
      sealSignInUrl: vi.fn().mockReturnValue('v1.sealed-link'),
      secret,
    })

    await Promise.all([
      coordinator.queueMail({
        expires,
        identifier,
        token: rawToken,
        url: `https://bekten.art/api/auth/callback/email?token=${rawToken}`,
      }),
      coordinator.storeVerificationToken(verificationToken()),
    ])

    expect(pause).toHaveBeenCalledWith(80)
  })

  it('rejects a callback URL outside the configured application origin', async () => {
    const queue = vi.fn().mockResolvedValue({accepted: true})
    const coordinator = createStudioMagicLinkCoordinator({
      appOrigin: 'https://bekten.art',
      minimumDurationMs: 0,
      queue,
      sealSignInUrl: vi.fn().mockReturnValue('v1.sealed-link'),
      secret,
    })

    const paired = Promise.all([
      coordinator.queueMail({
        expires,
        identifier,
        token: rawToken,
        url: `https://attacker.example/api/auth/callback/email?token=${rawToken}`,
      }),
      coordinator.storeVerificationToken(verificationToken()),
    ])

    await expect(paired).rejects.toThrow('Studio verification URL mismatch')
    expect(queue).not.toHaveBeenCalled()
  })

  it('rejects and removes an incomplete pair after a bounded timeout', async () => {
    vi.useFakeTimers()

    try {
      const coordinator = createStudioMagicLinkCoordinator({
        appOrigin: 'https://bekten.art',
        minimumDurationMs: 0,
        pairingTimeoutMs: 100,
        queue: vi.fn(),
        sealSignInUrl: vi.fn(),
        secret,
      })
      const pending = coordinator.queueMail({
        expires,
        identifier,
        token: rawToken,
        url: `https://bekten.art/api/auth/callback/email?token=${rawToken}`,
      })
      const rejection = expect(pending).rejects.toThrow(
        'Studio verification pairing timed out',
      )

      await vi.advanceTimersByTimeAsync(100)
      await rejection
    } finally {
      vi.useRealTimers()
    }
  })

  it('normalizes a single mailbox and rejects header or recipient injection', () => {
    expect(normalizeStudioEmail('  Editor@Example.COM  ')).toBe(
      'editor@example.com',
    )
    expect(() =>
      normalizeStudioEmail('editor@example.com,attacker@example.com'),
    ).toThrow('Invalid Studio email address')
    expect(() =>
      normalizeStudioEmail('editor@example.com\r\nBcc: attacker@example.com'),
    ).toThrow('Invalid Studio email address')
  })
})
