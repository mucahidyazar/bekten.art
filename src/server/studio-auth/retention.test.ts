import {describe, expect, it, vi} from 'vitest'

import {createStudioAuthRetention} from './retention'

describe('Studio auth retention', () => {
  it('deletes expired verification tokens and database sessions in a bounded batch', async () => {
    const database = {
      session: {deleteMany: vi.fn().mockResolvedValue({count: 2})},
      verificationToken: {deleteMany: vi.fn().mockResolvedValue({count: 3})},
    }
    const now = new Date('2026-08-10T12:00:00.000Z')
    const retention = createStudioAuthRetention(database, {
      batchSize: 250,
      now: () => now,
    })

    await expect(retention.run()).resolves.toEqual({
      sessions: 2,
      verificationTokens: 3,
    })
    expect(database.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: {expires: {lt: now}},
    })
    expect(database.session.deleteMany).toHaveBeenCalledWith({
      where: {expires: {lt: now}},
    })
  })

  it.each([0, 1001, 1.5])('rejects invalid batch size %s', batchSize => {
    expect(() =>
      createStudioAuthRetention(
        {
          session: {deleteMany: vi.fn()},
          verificationToken: {deleteMany: vi.fn()},
        },
        {batchSize},
      ),
    ).toThrow('batchSize must be an integer between 1 and 1000')
  })
})
