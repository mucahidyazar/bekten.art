import {describe, expect, it, vi} from 'vitest'

import {createDatabaseStudioMagicLinkStore} from './database-store'

const input = {
  identifier: 'editor@example.com',
  identifierHash: 'a'.repeat(64),
  mail: {
    expires: new Date('2026-08-10T12:10:00.000Z'),
    signInUrlEncrypted: 'v1.nonce.ciphertext.authentication-tag',
  },
  verification: {
    expires: new Date('2026-08-10T12:10:00.000Z'),
    identifier: 'editor@example.com',
    token: 'b'.repeat(64),
  },
}

function databaseWithUser(user: {id: string; role: string} | null) {
  const transaction = {
    auditEvent: {create: vi.fn().mockResolvedValue({id: 'audit-1'})},
    outboxJob: {create: vi.fn().mockResolvedValue({id: 'job-1'})},
    user: {findUnique: vi.fn().mockResolvedValue(user)},
    verificationToken: {create: vi.fn().mockResolvedValue(input.verification)},
  }
  const database = {
    $transaction: vi.fn(async callback => callback(transaction)),
  }

  return {database, transaction}
}

describe('database Studio magic-link store', () => {
  it.each(['EDITOR', 'OWNER', 'ADMIN'])(
    'atomically stores the hashed token, audit and outbox for %s',
    async role => {
      const {database, transaction} = databaseWithUser({
        id: '11111111-1111-4111-8111-111111111111',
        role,
      })
      const store = createDatabaseStudioMagicLinkStore(database)

      await expect(store.queue(input)).resolves.toEqual({accepted: true})
      expect(transaction.verificationToken.create).toHaveBeenCalledWith({
        data: input.verification,
      })
      expect(transaction.outboxJob.create).toHaveBeenCalledWith({
        data: {
          idempotencyKey: `studio.magic-link:${input.verification.token}`,
          payload: {
            expiresAt: input.mail.expires.toISOString(),
            signInUrlEncrypted: input.mail.signInUrlEncrypted,
            to: input.identifier,
          },
          type: 'studio.magic-link.requested',
        },
      })
      expect(JSON.stringify(transaction.outboxJob.create.mock.calls)).not.toContain(
        'token=secret',
      )
      expect(transaction.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'studio.magic-link.requested',
          actorUserId: '11111111-1111-4111-8111-111111111111',
          entityType: 'StudioSession',
        }),
      })
    },
  )

  it('keeps the response generic and creates neither token nor mail for unknown email', async () => {
    const {database, transaction} = databaseWithUser(null)
    const store = createDatabaseStudioMagicLinkStore(database)

    await expect(store.queue(input)).resolves.toEqual({accepted: false})
    expect(transaction.verificationToken.create).not.toHaveBeenCalled()
    expect(transaction.outboxJob.create).not.toHaveBeenCalled()
    expect(transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'studio.magic-link.rejected',
        actorUserId: null,
        metadata: {identifierHash: input.identifierHash},
      }),
    })
  })

  it('does not issue a link after an existing user loses its Studio role', async () => {
    const {database, transaction} = databaseWithUser({
      id: 'user-1',
      role: 'USER',
    })
    const store = createDatabaseStudioMagicLinkStore(database)

    await expect(store.queue(input)).resolves.toEqual({accepted: false})
    expect(transaction.verificationToken.create).not.toHaveBeenCalled()
    expect(transaction.outboxJob.create).not.toHaveBeenCalled()
  })
})
