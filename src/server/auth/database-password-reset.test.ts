import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createDatabasePasswordResetRepository} from './database-password-reset'

const now = new Date('2026-08-09T12:00:00.000Z')

function database() {
  const transaction = {
    passwordResetToken: {
      create: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({count: 1}),
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({count: 1}),
    },
    session: {deleteMany: vi.fn().mockResolvedValue({count: 2})},
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({count: 1}),
    },
  }

  return {
    adapter: {
      transaction: <Result>(
        callback: (client: typeof transaction) => Promise<Result>,
      ) => callback(transaction),
    },
    transaction,
  }
}

describe('database password reset repository', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('stores a replacement token only for a verified credentials account', async () => {
    const db = database()

    db.transaction.user.findUnique.mockResolvedValue({
      email: 'visitor@example.com',
      emailVerified: now,
      id: 'user-id',
      name: 'Visitor',
      passwordHash: 'old-hash',
    })
    const repository = createDatabasePasswordResetRepository(db.adapter)

    await expect(
      repository.issueReset({
        email: 'visitor@example.com',
        expiresAt: new Date('2026-08-09T12:30:00.000Z'),
        issuedAt: now,
        tokenHash: 'token-hash',
      }),
    ).resolves.toEqual({
      email: 'visitor@example.com',
      name: 'Visitor',
      shouldDeliver: true,
    })
    expect(db.transaction.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: {userId: 'user-id'},
    })
    expect(db.transaction.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        expiresAt: new Date('2026-08-09T12:30:00.000Z'),
        tokenHash: 'token-hash',
        userId: 'user-id',
      },
    })
  })

  it.each([
    null,
    {
      email: 'visitor@example.com',
      emailVerified: null,
      id: 'user-id',
      name: null,
      passwordHash: 'hash',
    },
    {
      email: 'visitor@example.com',
      emailVerified: now,
      id: 'user-id',
      name: null,
      passwordHash: null,
    },
  ])(
    'does not reveal or issue a token for an ineligible identity',
    async user => {
      const db = database()

      db.transaction.user.findUnique.mockResolvedValue(user)
      const repository = createDatabasePasswordResetRepository(db.adapter)

      await expect(
        repository.issueReset({
          email: 'visitor@example.com',
          expiresAt: new Date('2026-08-09T12:30:00.000Z'),
          issuedAt: now,
          tokenHash: 'token-hash',
        }),
      ).resolves.toBeNull()
      expect(db.transaction.passwordResetToken.create).not.toHaveBeenCalled()
    },
  )

  it('consumes one live token, updates the password and invalidates sessions', async () => {
    const db = database()

    db.transaction.passwordResetToken.findUnique.mockResolvedValue({
      expiresAt: new Date('2026-08-09T12:30:00.000Z'),
      id: 'reset-id',
      usedAt: null,
      userId: 'user-id',
    })
    const repository = createDatabasePasswordResetRepository(db.adapter)

    await expect(
      repository.consumeReset({
        now,
        passwordHash: 'new-hash',
        tokenHash: 'token-hash',
      }),
    ).resolves.toBe(true)
    expect(db.transaction.passwordResetToken.updateMany).toHaveBeenCalledWith({
      data: {usedAt: now},
      where: {
        expiresAt: {gt: now},
        id: 'reset-id',
        usedAt: null,
      },
    })
    expect(db.transaction.user.updateMany).toHaveBeenCalledWith({
      data: {
        passwordHash: 'new-hash',
        passwordResetRequired: false,
        sessionVersion: {increment: 1},
      },
      where: {id: 'user-id'},
    })
    expect(db.transaction.session.deleteMany).toHaveBeenCalledWith({
      where: {userId: 'user-id'},
    })
  })

  it('rejects an expired or already used token without changing the user', async () => {
    const db = database()

    db.transaction.passwordResetToken.findUnique.mockResolvedValue({
      expiresAt: new Date('2026-08-09T11:59:00.000Z'),
      id: 'reset-id',
      usedAt: null,
      userId: 'user-id',
    })
    const repository = createDatabasePasswordResetRepository(db.adapter)

    await expect(
      repository.consumeReset({
        now,
        passwordHash: 'new-hash',
        tokenHash: 'token-hash',
      }),
    ).resolves.toBe(false)
    expect(db.transaction.user.updateMany).not.toHaveBeenCalled()
  })
})
