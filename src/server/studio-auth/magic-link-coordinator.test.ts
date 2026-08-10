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
      minimumDurationMs: 0,
      queue,
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
      minimumDurationMs: 0,
      queue,
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
      minimumDurationMs: 100,
      monotonicNow,
      pause,
      queue: vi.fn().mockResolvedValue({accepted: false}),
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
