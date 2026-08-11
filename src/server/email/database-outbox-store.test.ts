import {describe, expect, it, vi} from 'vitest'

import {createDatabaseOutboxStore} from './database-outbox-store'

const now = new Date('2026-08-09T12:00:00.000Z')
const jobId = 'b8f73ce3-8272-4691-bce8-dde03e6a9489'

function database() {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{id: jobId}]),
    feedback: {findUnique: vi.fn().mockResolvedValue(null)},
    inquiry: {findUnique: vi.fn().mockResolvedValue(null)},
    newsletterSubscriber: {findUnique: vi.fn().mockResolvedValue(null)},
    outboxJob: {
      updateMany: vi.fn().mockResolvedValue({count: 1}),
    },
  }
}

describe('database outbox store', () => {
  it('claims one due or stale job atomically', async () => {
    const client = database()
    const store = createDatabaseOutboxStore(client)

    await store.claim({
      lockExpiredBefore: new Date('2026-08-09T11:55:00.000Z'),
      now,
      workerId: 'worker-1',
    })

    expect(client.$queryRaw).toHaveBeenCalledOnce()
    const values = client.$queryRaw.mock.calls[0]?.slice(1)

    expect(values).toContain('worker-1')
    expect(values).toContain(now)
  })

  it('only completes a job still held by the same worker', async () => {
    const client = database()
    const store = createDatabaseOutboxStore(client)

    await expect(store.complete(jobId, 'worker-1', now)).resolves.toBe(true)
    expect(client.outboxJob.updateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({
        completedAt: now,
        lockedAt: null,
        lockedBy: null,
        status: 'COMPLETED',
      }),
      where: {id: jobId, lockedBy: 'worker-1', status: 'PROCESSING'},
    })
  })

  it('stores only bounded safe errors and releases the lease for retry', async () => {
    const client = database()
    const store = createDatabaseOutboxStore(client)
    const availableAt = new Date('2026-08-09T12:00:30.000Z')

    await store.retry(jobId, 'worker-1', {
      availableAt,
      error: 'EMAIL_DELIVERY_FAILED',
      terminal: false,
    })

    expect(client.outboxJob.updateMany).toHaveBeenCalledWith({
      data: {
        availableAt,
        lastError: 'EMAIL_DELIVERY_FAILED',
        lockedAt: null,
        lockedBy: null,
        status: 'PENDING',
      },
      where: {id: jobId, lockedBy: 'worker-1', status: 'PROCESSING'},
    })
  })

  it('loads only the fields required for feedback, inquiry and newsletter delivery', async () => {
    const client = database()
    const store = createDatabaseOutboxStore(client)

    await store.findFeedback(jobId)
    await store.findInquiry(jobId)
    await store.findSubscriber(jobId)

    expect(client.feedback.findUnique).toHaveBeenCalledWith({
      select: {email: true, message: true, name: true, subject: true},
      where: {id: jobId},
    })
    expect(client.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
      select: {email: true, locale: true},
      where: {id: jobId},
    })
    expect(client.inquiry.findUnique).toHaveBeenCalledWith({
      select: {
        brief: true,
        email: true,
        locale: true,
        message: true,
        name: true,
        relatedArtworkTitle: true,
        subject: true,
        type: true,
      },
      where: {id: jobId},
    })
  })

  it('marks terminal jobs failed while keeping the compare-and-set lease', async () => {
    const client = database()
    const store = createDatabaseOutboxStore(client)

    await store.retry(jobId, 'worker-1', {
      availableAt: now,
      error: 'x'.repeat(300),
      terminal: true,
    })

    expect(client.outboxJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastError: 'x'.repeat(200),
          status: 'FAILED',
        }),
      }),
    )
  })
})
