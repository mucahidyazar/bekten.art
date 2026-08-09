import {describe, expect, it, vi} from 'vitest'

import {createOperationalRepository} from '../operations/operational-repository'

const now = new Date('2026-08-09T14:00:00.000Z')
const feedbackId = 'b8f73ce3-8272-4691-bce8-dde03e6a9489'
const adminId = 'f0cfe454-08e7-433c-95af-ddf49ee64a80'

function feedbackRow(overrides: Record<string, unknown> = {}) {
  return {
    id: feedbackId,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    subject: 'Artwork inquiry',
    message: 'I would like to learn more about this original artwork.',
    locale: 'en',
    rating: null,
    source: 'contact-form',
    status: 'NEW',
    privacyAcceptedAt: now,
    purgeAfter: new Date('2027-08-09T14:00:00.000Z'),
    resolvedAt: null,
    resolvedByUserId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function configuredDatabase() {
  const feedback = {
    create: vi.fn().mockResolvedValue(feedbackRow()),
    deleteMany: vi.fn().mockResolvedValue({count: 1}),
    findUnique: vi.fn().mockResolvedValue(feedbackRow()),
    updateMany: vi.fn().mockResolvedValue({count: 1}),
  }
  const outboxJob = {create: vi.fn().mockResolvedValue({id: 'job-id'})}
  const auditEvent = {create: vi.fn().mockResolvedValue({id: 'audit-id'})}
  const user = {deleteMany: vi.fn().mockResolvedValue({count: 1})}
  const transaction = vi.fn(callback =>
    callback({auditEvent, feedback, outboxJob, user}),
  )

  return {
    auditEvent,
    database: {$transaction: transaction},
    feedback,
    outboxJob,
    transaction,
    user,
  }
}

describe('operational repository', () => {
  it('creates feedback and a durable notification job atomically', async () => {
    const {database, feedback, outboxJob, transaction} = configuredDatabase()
    const repository = createOperationalRepository(database, {now: () => now})

    const result = await repository.createFeedback({
      email: 'ADA@EXAMPLE.COM',
      locale: 'en',
      message: 'I would like to learn more about this original artwork.',
      name: 'Ada Lovelace',
      privacyAcceptedAt: now,
      source: 'contact-form',
      subject: 'Artwork inquiry',
    })

    expect(transaction).toHaveBeenCalledOnce()
    expect(feedback.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'ada@example.com',
        purgeAfter: new Date('2027-08-09T14:00:00.000Z'),
      }),
    })
    expect(outboxJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: `feedback.created:${feedbackId}`,
        type: 'feedback.created',
      }),
    })
    expect(result.id).toBe(feedbackId)
  })

  it('prevents an administrator from deleting their own account', async () => {
    const {database, transaction} = configuredDatabase()
    const repository = createOperationalRepository(database)

    await expect(repository.removeUser(adminId, adminId)).rejects.toThrow(
      'You cannot remove your own administrator account',
    )
    expect(transaction).not.toHaveBeenCalled()
  })

  it('records a non-sensitive audit event when feedback is removed', async () => {
    const {auditEvent, database, feedback} = configuredDatabase()
    const repository = createOperationalRepository(database)

    await repository.removeFeedback(feedbackId, adminId)

    expect(feedback.deleteMany).toHaveBeenCalledWith({where: {id: feedbackId}})
    expect(auditEvent.create).toHaveBeenCalledWith({
      data: {
        action: 'feedback.deleted',
        actorUserId: adminId,
        entityId: feedbackId,
        entityType: 'Feedback',
        metadata: {},
      },
    })
  })

  it('rejects removal when the feedback no longer exists', async () => {
    const {database, feedback} = configuredDatabase()

    feedback.deleteMany.mockResolvedValue({count: 0})
    const repository = createOperationalRepository(database)

    await expect(repository.removeFeedback(feedbackId, adminId)).rejects.toThrow(
      'Feedback not found',
    )
  })

  it('removes another user and records the administrator audit event', async () => {
    const userId = 'dfca6e9f-7635-4216-9df7-b7d69ee33abb'
    const {auditEvent, database, user} = configuredDatabase()
    const repository = createOperationalRepository(database)

    await repository.removeUser(userId, adminId)

    expect(user.deleteMany).toHaveBeenCalledWith({where: {id: userId}})
    expect(auditEvent.create).toHaveBeenCalledWith({
      data: {
        action: 'user.deleted',
        actorUserId: adminId,
        entityId: userId,
        entityType: 'User',
        metadata: {},
      },
    })
  })

  it('rejects removal when the user no longer exists', async () => {
    const userId = 'dfca6e9f-7635-4216-9df7-b7d69ee33abb'
    const {database, user} = configuredDatabase()

    user.deleteMany.mockResolvedValue({count: 0})
    const repository = createOperationalRepository(database)

    await expect(repository.removeUser(userId, adminId)).rejects.toThrow(
      'User not found',
    )
  })

  it('marks feedback resolved with its resolver and timestamp', async () => {
    const {auditEvent, database, feedback} = configuredDatabase()

    feedback.findUnique.mockResolvedValue(
      feedbackRow({
        resolvedAt: now,
        resolvedByUserId: adminId,
        status: 'RESOLVED',
      }),
    )
    const repository = createOperationalRepository(database, {now: () => now})

    const result = await repository.updateFeedback(
      feedbackId,
      'RESOLVED',
      adminId,
    )

    expect(feedback.updateMany).toHaveBeenCalledWith({
      data: {
        resolvedAt: now,
        resolvedByUserId: adminId,
        status: 'RESOLVED',
      },
      where: {id: feedbackId},
    })
    expect(auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'feedback.status_updated',
        metadata: {status: 'RESOLVED'},
      }),
    })
    expect(result.status).toBe('RESOLVED')
  })

  it('clears resolver metadata when feedback returns to review', async () => {
    const {database, feedback} = configuredDatabase()

    feedback.findUnique.mockResolvedValue(feedbackRow({status: 'IN_REVIEW'}))
    const repository = createOperationalRepository(database, {now: () => now})

    await repository.updateFeedback(feedbackId, 'IN_REVIEW', adminId)

    expect(feedback.updateMany).toHaveBeenCalledWith({
      data: {
        resolvedAt: null,
        resolvedByUserId: null,
        status: 'IN_REVIEW',
      },
      where: {id: feedbackId},
    })
  })

  it('rejects status updates when the feedback no longer exists', async () => {
    const {database, feedback} = configuredDatabase()

    feedback.updateMany.mockResolvedValue({count: 0})
    const repository = createOperationalRepository(database)

    await expect(
      repository.updateFeedback(feedbackId, 'SPAM', adminId),
    ).rejects.toThrow('Feedback not found')
  })
})
