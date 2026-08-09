import {describe, expect, it, vi} from 'vitest'

import {createRetentionService} from './retention'

function databaseFixture() {
  return {
    emailWebhookEvent: {
      deleteMany: vi.fn().mockResolvedValue({count: 1}),
      findMany: vi.fn().mockResolvedValue([{id: 'webhook-1'}]),
    },
    feedback: {
      deleteMany: vi.fn().mockResolvedValue({count: 2}),
      findMany: vi
        .fn()
        .mockResolvedValue([{id: 'feedback-1'}, {id: 'feedback-2'}]),
    },
    outboxJob: {
      deleteMany: vi.fn().mockResolvedValue({count: 1}),
      findMany: vi.fn().mockResolvedValue([{id: 'outbox-1'}]),
    },
    passwordResetToken: {
      deleteMany: vi.fn().mockResolvedValue({count: 1}),
      findMany: vi.fn().mockResolvedValue([{id: 'reset-1'}]),
    },
    rateLimitBucket: {
      deleteMany: vi.fn().mockResolvedValue({count: 2}),
      findMany: vi.fn().mockResolvedValue([
        {action: 'login.ip', key: 'a'.repeat(64)},
        {action: 'register.ip', key: 'b'.repeat(64)},
      ]),
    },
    verificationToken: {
      deleteMany: vi.fn().mockResolvedValue({count: 1}),
      findMany: vi
        .fn()
        .mockResolvedValue([
          {identifier: 'verify@example.com', token: 'verify-token'},
        ]),
    },
  }
}

describe('retention service', () => {
  it('deletes only bounded expired candidates and returns aggregate counts', async () => {
    const database = databaseFixture()
    const now = new Date('2026-08-09T18:00:00.000Z')
    const service = createRetentionService(database, {
      batchSize: 500,
      now: () => now,
    })

    const result = await service.run()

    expect(database.feedback.findMany).toHaveBeenCalledWith({
      orderBy: {purgeAfter: 'asc'},
      select: {id: true},
      take: 500,
      where: {purgeAfter: {lte: now}},
    })
    expect(database.rateLimitBucket.findMany).toHaveBeenCalledWith({
      orderBy: {updatedAt: 'asc'},
      select: {action: true, key: true},
      take: 500,
      where: {updatedAt: {lt: new Date('2026-08-07T18:00:00.000Z')}},
    })
    expect(database.outboxJob.findMany).toHaveBeenCalledWith({
      orderBy: {completedAt: 'asc'},
      select: {id: true},
      take: 500,
      where: {
        completedAt: {lt: new Date('2026-07-10T18:00:00.000Z')},
        status: 'COMPLETED',
      },
    })
    expect(database.emailWebhookEvent.findMany).toHaveBeenCalledWith({
      orderBy: {createdAt: 'asc'},
      select: {id: true},
      take: 500,
      where: {createdAt: {lt: new Date('2026-05-11T18:00:00.000Z')}},
    })
    expect(database.feedback.deleteMany).toHaveBeenCalledWith({
      where: {id: {in: ['feedback-1', 'feedback-2']}},
    })
    expect(database.rateLimitBucket.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {action: 'login.ip', key: 'a'.repeat(64)},
          {action: 'register.ip', key: 'b'.repeat(64)},
        ],
      },
    })
    expect(result).toEqual({
      emailWebhookEvents: 1,
      feedback: 2,
      outboxJobs: 1,
      passwordResetTokens: 1,
      rateLimitBuckets: 2,
      verificationTokens: 1,
    })
  })

  it('does not issue empty deleteMany calls', async () => {
    const database = databaseFixture()

    for (const delegate of Object.values(database)) {
      delegate.findMany.mockResolvedValue([])
    }

    const result = await createRetentionService(database).run()

    expect(result).toEqual({
      emailWebhookEvents: 0,
      feedback: 0,
      outboxJobs: 0,
      passwordResetTokens: 0,
      rateLimitBuckets: 0,
      verificationTokens: 0,
    })
    for (const delegate of Object.values(database)) {
      expect(delegate.deleteMany).not.toHaveBeenCalled()
    }
  })

  it('rejects an unsafe batch size', () => {
    expect(() =>
      createRetentionService(databaseFixture(), {batchSize: 0}),
    ).toThrow('batchSize must be an integer between 1 and 1000')
    expect(() =>
      createRetentionService(databaseFixture(), {batchSize: 1001}),
    ).toThrow('batchSize must be an integer between 1 and 1000')
  })
})
