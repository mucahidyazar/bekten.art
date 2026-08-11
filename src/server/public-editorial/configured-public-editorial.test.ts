import {describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({configuredTransaction: vi.fn()}))

vi.mock('@/lib/db', () => ({
  prisma: {$transaction: mocks.configuredTransaction},
}))

import {createPrismaPublicEditorialDatabase} from './configured-public-editorial'

describe('configured public editorial database', () => {
  it('adapts every required Prisma delegate without a production double-cast', async () => {
    const delegateNames = [
      'artwork',
      'collection',
      'contentRevision',
      'exhibition',
      'exhibitionArtwork',
      'journalEntry',
      'mediaObject',
      'page',
      'pressItem',
    ] as const
    const delegates = Object.fromEntries(
      delegateNames.map(name => [name, {findMany: vi.fn(async () => [name])}]),
    )
    const client = {
      $transaction: vi.fn(async callback => callback(delegates)),
    }
    const database = createPrismaPublicEditorialDatabase(client as never)

    const result = await database.$transaction(async transaction =>
      Promise.all(
        delegateNames.map(name => {
          const delegate = transaction[name] as {
            findMany: (arguments_: unknown) => Promise<readonly unknown[]>
          }

          return delegate.findMany({where: {status: 'PUBLISHED'}})
        }),
      ),
    )

    expect(result).toEqual(delegateNames.map(name => [name]))

    for (const name of delegateNames) {
      expect(delegates[name].findMany).toHaveBeenCalledWith({
        where: {status: 'PUBLISHED'},
      })
    }
  })
})
