import {describe, expect, it, vi} from 'vitest'

import {createDatabaseStudioUserStore} from './database-studio-user-store'

const ownerId = '11111111-1111-4111-8111-111111111111'
const actorId = '22222222-2222-4222-8222-222222222222'

type Target = Readonly<{
  email: string
  id: string
  role: string
  sessionVersion: number
  studioStatus: string
}>

function setup(
  target: Target | null = {
    email: 'owner@example.com',
    id: ownerId,
    role: 'OWNER',
    sessionVersion: 2,
    studioStatus: 'ACTIVE',
  },
) {
  const transaction = {
    auditEvent: {create: vi.fn().mockResolvedValue({id: 'audit'})},
    outboxJob: {create: vi.fn().mockResolvedValue({id: 'job'})},
    session: {deleteMany: vi.fn().mockResolvedValue({count: 1})},
    user: {
      count: vi.fn().mockResolvedValue(1),
      create: vi.fn().mockResolvedValue({id: ownerId}),
      findUnique: vi.fn().mockResolvedValue(target),
      update: vi.fn().mockResolvedValue({id: ownerId}),
      updateMany: vi.fn().mockResolvedValue({count: 1}),
    },
    verificationToken: {
      create: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({count: 0}),
    },
  }
  const database = {
    $transaction: vi.fn(async callback => callback(transaction)),
    user: {findMany: vi.fn().mockResolvedValue([])},
  }

  const store = createDatabaseStudioUserStore(database, {
    appUrl: 'http://localhost:3000',
    now: () => new Date('2026-08-11T12:00:00.000Z'),
    secret: 's'.repeat(64),
  })

  return {store, transaction}
}

describe('database Studio user store', () => {
  it('transactionally refuses to demote the final active owner', async () => {
    const {store, transaction} = setup()

    await expect(
      store.changeRole({actorId, id: ownerId, role: 'EDITOR', version: 2}),
    ).rejects.toThrow('STUDIO_LAST_OWNER_REQUIRED')
    expect(transaction.user.updateMany).not.toHaveBeenCalled()
  })

  it('revokes sessions and audits an optimistic role change', async () => {
    const {store, transaction} = setup()

    transaction.user.count.mockResolvedValue(2)

    await store.changeRole({actorId, id: ownerId, role: 'EDITOR', version: 2})

    expect(transaction.user.updateMany).toHaveBeenCalledWith({
      data: {role: 'EDITOR', sessionVersion: {increment: 1}},
      where: {id: ownerId, sessionVersion: 2},
    })
    expect(transaction.session.deleteMany).toHaveBeenCalledWith({
      where: {userId: ownerId},
    })
    expect(transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'studio.user.role-changed',
        actorUserId: actorId,
      }),
    })
  })

  it('atomically creates an invitation without plaintext tokens in the outbox', async () => {
    const {store, transaction} = setup(null)

    await store.invite({
      actorId,
      email: 'editor@example.com',
      name: 'Editor',
      role: 'EDITOR',
    })

    expect(transaction.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'editor@example.com',
        role: 'EDITOR',
        studioStatus: 'INVITED',
      }),
      select: {id: true},
    })
    const outbox = JSON.stringify(transaction.outboxJob.create.mock.calls)

    expect(outbox).toContain('studio.magic-link.requested')
    expect(outbox).not.toContain('token=')

    expect(transaction.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({token: expect.stringMatching(/^[a-f0-9]{64}$/u)}),
    })
  })

  it('rejects stale updates instead of overwriting a concurrent owner action', async () => {
    const {store, transaction} = setup({
      email: 'editor@example.com',
      id: ownerId,
      role: 'EDITOR',
      sessionVersion: 4,
      studioStatus: 'ACTIVE',
    })

    transaction.user.updateMany.mockResolvedValue({count: 0})

    await expect(
      store.changeStatus({
        actorId,
        id: ownerId,
        status: 'SUSPENDED',
        version: 3,
      }),
    ).rejects.toThrow('STUDIO_USER_CONFLICT')
  })
})
