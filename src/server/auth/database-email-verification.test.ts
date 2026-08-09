import {describe, expect, it, vi} from 'vitest'

import {createDatabaseEmailVerificationRepository} from './database-email-verification'

function createDatabase() {
  const transactionClient = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
  }

  return {
    database: {
      transaction: vi.fn(async callback => callback(transactionClient)),
    },
    transactionClient,
  }
}

const issueInput = {
  email: 'artist@example.com',
  expiresAt: new Date('2026-08-09T11:00:00.000Z'),
  issuedAt: new Date('2026-08-09T10:00:00.000Z'),
  name: 'Artist',
  passwordHash: 'new-password-hash',
  tokenHash: 'token-hash',
}

describe('database email verification repository', () => {
  it('creates an unverified account and replaces stale verification tokens atomically', async () => {
    const {database, transactionClient} = createDatabase()

    transactionClient.user.findUnique.mockResolvedValue(null)
    transactionClient.user.create.mockResolvedValue({
      email: issueInput.email,
      emailVerified: null,
      name: issueInput.name,
    })
    const repository = createDatabaseEmailVerificationRepository(database)

    await expect(repository.issueVerification(issueInput)).resolves.toEqual({
      email: issueInput.email,
      name: issueInput.name,
      shouldDeliver: true,
    })
    expect(transactionClient.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: issueInput.email,
        emailVerified: null,
        passwordHash: issueInput.passwordHash,
      }),
      select: {email: true, emailVerified: true, name: true},
    })
    expect(transactionClient.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: {identifier: issueInput.email},
    })
    expect(transactionClient.verificationToken.create).toHaveBeenCalledWith({
      data: {
        expires: issueInput.expiresAt,
        identifier: issueInput.email,
        token: issueInput.tokenHash,
      },
    })
  })

  it('binds a repeat unverified registration to the newest password and token', async () => {
    const {database, transactionClient} = createDatabase()

    transactionClient.user.findUnique.mockResolvedValue({
      email: issueInput.email,
      emailVerified: null,
      name: 'Existing Artist',
    })
    transactionClient.user.updateMany.mockResolvedValue({count: 1})
    const repository = createDatabaseEmailVerificationRepository(database)

    await expect(repository.issueVerification(issueInput)).resolves.toEqual({
      email: issueInput.email,
      name: issueInput.name,
      shouldDeliver: true,
    })
    expect(transactionClient.user.create).not.toHaveBeenCalled()
    expect(transactionClient.user.updateMany).toHaveBeenCalledWith({
      data: {
        name: issueInput.name,
        passwordHash: issueInput.passwordHash,
      },
      where: {email: issueInput.email, emailVerified: null},
    })
    expect(transactionClient.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: {identifier: issueInput.email},
    })
  })

  it('returns the same generic target without issuing a token for a verified account', async () => {
    const {database, transactionClient} = createDatabase()

    transactionClient.user.findUnique.mockResolvedValue({
      email: issueInput.email,
      emailVerified: new Date('2026-08-01T00:00:00.000Z'),
      name: 'Existing Artist',
    })
    const repository = createDatabaseEmailVerificationRepository(database)

    await expect(repository.issueVerification(issueInput)).resolves.toEqual({
      email: issueInput.email,
      name: 'Existing Artist',
      shouldDeliver: false,
    })
    expect(transactionClient.verificationToken.create).not.toHaveBeenCalled()
  })

  it('consumes a live token once before marking the user verified', async () => {
    const {database, transactionClient} = createDatabase()

    transactionClient.verificationToken.findUnique.mockResolvedValue({
      expires: new Date('2026-08-09T11:00:00.000Z'),
      identifier: issueInput.email,
    })
    transactionClient.verificationToken.deleteMany.mockResolvedValue({count: 1})
    transactionClient.user.updateMany.mockResolvedValue({count: 1})
    const repository = createDatabaseEmailVerificationRepository(database)

    await expect(
      repository.verifyToken({
        now: new Date('2026-08-09T10:00:00.000Z'),
        tokenHash: issueInput.tokenHash,
      }),
    ).resolves.toBe(true)
    expect(transactionClient.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: {
        expires: {gt: new Date('2026-08-09T10:00:00.000Z')},
        identifier: issueInput.email,
        token: issueInput.tokenHash,
      },
    })
    expect(transactionClient.user.updateMany).toHaveBeenCalledWith({
      data: {emailVerified: new Date('2026-08-09T10:00:00.000Z')},
      where: {email: issueInput.email, emailVerified: null},
    })
    expect(transactionClient.verificationToken.deleteMany).toHaveBeenLastCalledWith({
      where: {identifier: issueInput.email},
    })
  })

  it('fails closed when a concurrent request already consumed the token', async () => {
    const {database, transactionClient} = createDatabase()

    transactionClient.verificationToken.findUnique.mockResolvedValue({
      expires: new Date('2026-08-09T11:00:00.000Z'),
      identifier: issueInput.email,
    })
    transactionClient.verificationToken.deleteMany.mockResolvedValue({count: 0})
    const repository = createDatabaseEmailVerificationRepository(database)

    await expect(
      repository.verifyToken({
        now: new Date('2026-08-09T10:00:00.000Z'),
        tokenHash: issueInput.tokenHash,
      }),
    ).resolves.toBe(false)
    expect(transactionClient.user.updateMany).not.toHaveBeenCalled()
  })

  it('deletes and rejects an expired token', async () => {
    const {database, transactionClient} = createDatabase()

    transactionClient.verificationToken.findUnique.mockResolvedValue({
      expires: new Date('2026-08-09T09:59:59.000Z'),
      identifier: issueInput.email,
    })
    const repository = createDatabaseEmailVerificationRepository(database)

    await expect(
      repository.verifyToken({
        now: new Date('2026-08-09T10:00:00.000Z'),
        tokenHash: issueInput.tokenHash,
      }),
    ).resolves.toBe(false)
    expect(transactionClient.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: {token: issueInput.tokenHash},
    })
    expect(transactionClient.user.updateMany).not.toHaveBeenCalled()
  })
})
