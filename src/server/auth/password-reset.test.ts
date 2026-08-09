import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createPasswordResetService} from './password-reset'

const validToken = 'r'.repeat(43)
const now = new Date('2026-08-09T12:00:00.000Z')

function dependencies() {
  return {
    consumeReset: vi.fn().mockResolvedValue(true),
    createToken: vi.fn(() => validToken),
    deliverReset: vi.fn().mockResolvedValue(undefined),
    hashPassword: vi.fn().mockResolvedValue('new-password-hash'),
    issueReset: vi.fn().mockResolvedValue({
      email: 'visitor@example.com',
      name: 'Visitor',
      shouldDeliver: true,
    }),
    now: () => now,
  }
}

describe('password reset service', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('issues a hashed, thirty-minute token and delivers a localized link', async () => {
    const deps = dependencies()
    const service = createPasswordResetService(deps)

    await expect(
      service.request(
        {email: ' Visitor@Example.com ', locale: 'tr'},
        'https://bekten.art',
      ),
    ).resolves.toEqual({accepted: true})

    expect(deps.issueReset).toHaveBeenCalledWith({
      email: 'visitor@example.com',
      expiresAt: new Date('2026-08-09T12:30:00.000Z'),
      issuedAt: now,
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
    })
    expect(deps.deliverReset).toHaveBeenCalledWith({
      idempotencyKey: expect.stringMatching(/^password-reset:[a-f0-9]{64}$/u),
      locale: 'tr',
      name: 'Visitor',
      resetUrl: `https://bekten.art/tr/reset-password?token=${validToken}`,
      to: 'visitor@example.com',
    })
  })

  it('returns the same accepted result without delivery for an unknown identity', async () => {
    const deps = dependencies()

    deps.issueReset.mockResolvedValue(null)
    const service = createPasswordResetService(deps)

    await expect(
      service.request(
        {email: 'unknown@example.com', locale: 'en'},
        'https://bekten.art',
      ),
    ).resolves.toEqual({accepted: true})
    expect(deps.deliverReset).not.toHaveBeenCalled()
  })

  it('rejects malformed request and reset payloads at the boundary', async () => {
    const deps = dependencies()
    const service = createPasswordResetService(deps)

    await expect(
      service.request({email: 'invalid'}, 'https://bekten.art'),
    ).rejects.toThrow('PASSWORD_RESET_INPUT_INVALID')
    await expect(
      service.reset({password: 'too-short', token: 'invalid'}),
    ).rejects.toThrow('PASSWORD_RESET_INPUT_INVALID')
  })

  it('hashes the replacement password and atomically consumes the token', async () => {
    const deps = dependencies()
    const service = createPasswordResetService(deps)

    await expect(
      service.reset({
        password: 'a-new-password-with-entropy',
        token: validToken,
      }),
    ).resolves.toBe(true)
    expect(deps.hashPassword).toHaveBeenCalledWith(
      'a-new-password-with-entropy',
    )
    expect(deps.consumeReset).toHaveBeenCalledWith({
      now,
      passwordHash: 'new-password-hash',
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
    })
  })
})
