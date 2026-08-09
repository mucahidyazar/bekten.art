import {describe, expect, it, vi} from 'vitest'

import {createEmailVerificationService} from './email-verification'

function createDependencies() {
  return {
    createToken: vi.fn().mockReturnValue('a'.repeat(43)),
    deliverVerification: vi.fn().mockResolvedValue(undefined),
    hashPassword: vi.fn().mockResolvedValue('password-hash'),
    issueVerification: vi.fn().mockResolvedValue({
      email: 'artist@example.com',
      name: 'Artist',
      shouldDeliver: true,
    }),
    now: vi.fn().mockReturnValue(new Date('2026-08-09T10:00:00.000Z')),
    verifyToken: vi.fn().mockResolvedValue(true),
  }
}

describe('email verification service', () => {
  it('stores only a token hash and delivers the raw token only inside the URL', async () => {
    const dependencies = createDependencies()
    const service = createEmailVerificationService(dependencies)

    await expect(
      service.register(
        {
          email: ' ARTIST@Example.com ',
          name: ' Artist ',
          password: 'correct horse battery staple',
        },
        'https://bekten.art',
      ),
    ).resolves.toEqual({accepted: true})

    const issue = dependencies.issueVerification.mock.calls[0]?.[0]

    expect(issue.email).toBe('artist@example.com')
    expect(issue.passwordHash).toBe('password-hash')
    expect(issue.tokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(issue.tokenHash).not.toContain('a'.repeat(43))
    expect(issue.expiresAt).toEqual(new Date('2026-08-09T11:00:00.000Z'))
    expect(issue.issuedAt).toEqual(new Date('2026-08-09T10:00:00.000Z'))

    expect(dependencies.deliverVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: `verify-email:${issue.tokenHash}`,
        to: 'artist@example.com',
        verificationUrl:
          `https://bekten.art/api/auth/verify-email?token=${'a'.repeat(43)}`,
      }),
    )
  })

  it('returns the same accepted result without delivery for a verified identity', async () => {
    const dependencies = createDependencies()

    dependencies.issueVerification.mockResolvedValue({
      email: 'artist@example.com',
      name: 'Artist',
      shouldDeliver: false,
    })
    const service = createEmailVerificationService(dependencies)

    await expect(
      service.register(
        {
          email: 'artist@example.com',
          name: 'Artist',
          password: 'correct horse battery staple',
        },
        'https://bekten.art',
      ),
    ).resolves.toEqual({accepted: true})
    expect(dependencies.deliverVerification).not.toHaveBeenCalled()
  })

  it.each([
    {email: 'invalid', name: 'Artist', password: 'correct horse battery staple'},
    {email: 'artist@example.com', name: 'A', password: 'correct horse battery staple'},
    {email: 'artist@example.com', name: 'Artist', password: 'too-short'},
  ])('rejects invalid registration input', async input => {
    const dependencies = createDependencies()
    const service = createEmailVerificationService(dependencies)

    await expect(service.register(input, 'https://bekten.art')).rejects.toThrow(
      'REGISTRATION_INPUT_INVALID',
    )
    expect(dependencies.issueVerification).not.toHaveBeenCalled()
  })

  it('atomically consumes the hash of a well-formed token', async () => {
    const dependencies = createDependencies()
    const service = createEmailVerificationService(dependencies)

    await expect(service.verify('a'.repeat(43))).resolves.toBe(true)
    expect(dependencies.verifyToken).toHaveBeenCalledWith(
      expect.objectContaining({
        now: new Date('2026-08-09T10:00:00.000Z'),
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    )
  })

  it.each(['', 'not a token', 'a'.repeat(42), 'a'.repeat(44)])(
    'rejects a malformed token without a database lookup',
    async token => {
      const dependencies = createDependencies()
      const service = createEmailVerificationService(dependencies)

      await expect(service.verify(token)).resolves.toBe(false)
      expect(dependencies.verifyToken).not.toHaveBeenCalled()
    },
  )
})
