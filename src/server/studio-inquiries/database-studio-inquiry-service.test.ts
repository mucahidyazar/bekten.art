import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createDatabaseStudioInquiryService} from './database-studio-inquiry-service'

const inquiryId = '00000000-0000-4000-8000-000000000002'
const actorUserId = '00000000-0000-4000-8000-000000000001'

describe('database Studio inquiry service', () => {
  const auditCreate = vi.fn()
  const inquiryUpdate = vi.fn()
  const noteCreate = vi.fn()
  const transaction = vi.fn(async callback =>
    callback({
      auditEvent: {create: auditCreate},
      inquiry: {update: inquiryUpdate},
      inquiryInternalNote: {create: noteCreate},
    }),
  )
  const service = createDatabaseStudioInquiryService(
    {
      $transaction: transaction,
      inquiry: {findMany: vi.fn(), findUnique: vi.fn()},
    },
    {
      generateId: () => '00000000-0000-4000-8000-000000000003',
      now: () => new Date('2026-08-11T08:00:00.000Z'),
    },
  )

  beforeEach(() => {
    vi.clearAllMocks()
    inquiryUpdate.mockResolvedValue({id: inquiryId})
    noteCreate.mockResolvedValue({id: 'note-1'})
  })

  it('updates status, labels and a private note atomically with an audit event', async () => {
    await service.update({
      actorUserId,
      inquiryId,
      labels: ['priority', 'private-viewing'],
      note: 'Collector requested an afternoon appointment.',
      requestId: 'request-1',
      status: 'IN_REVIEW',
    })

    expect(inquiryUpdate).toHaveBeenCalledWith({
      data: {
        labels: ['priority', 'private-viewing'],
        status: 'IN_REVIEW',
        updatedAt: new Date('2026-08-11T08:00:00.000Z'),
      },
      where: {id: inquiryId},
    })
    expect(noteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorUserId: actorUserId,
          body: 'Collector requested an afternoon appointment.',
          inquiryId,
        }),
      }),
    )
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({action: 'inquiry.studio-updated'}),
      }),
    )
  })

  it('rejects invalid labels before opening a transaction', async () => {
    await expect(
      service.update({
        actorUserId,
        inquiryId,
        labels: ['Not Safe'],
        note: '',
        requestId: 'request-1',
        status: 'NEW',
      }),
    ).rejects.toThrow()
    expect(transaction).not.toHaveBeenCalled()
  })
})
