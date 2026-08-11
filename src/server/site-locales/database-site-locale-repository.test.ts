import {describe, expect, it, vi} from 'vitest'

import {createDatabaseSiteLocaleRepository} from './database-site-locale-repository'

const actorUserId = '10000000-0000-4000-8000-000000000001'
const locale = Object.freeze({
  code: 'de',
  direction: 'LTR' as const,
  englishName: 'German',
  nativeName: 'Deutsch',
  sortOrder: 4,
  status: 'DRAFT' as const,
})

function configuredDatabase() {
  const transaction = {
    auditEvent: {create: vi.fn(async () => ({id: 'audit'}))},
    siteLocale: {
      create: vi.fn(async () => locale),
      update: vi.fn(async () => ({...locale, status: 'ACTIVE'})),
    },
  }
  const database = {
    $transaction: vi.fn(callback => callback(transaction)),
    siteLocale: {
      findMany: vi.fn(async () => [locale]),
      findUnique: vi.fn(async () => locale),
    },
  }

  return {database, transaction}
}

describe('database site locale repository', () => {
  it('creates draft locale metadata and a value-free audit event atomically', async () => {
    const {database, transaction} = configuredDatabase()
    const repository = createDatabaseSiteLocaleRepository(database)

    await repository.create({...locale, actorUserId})

    expect(transaction.siteLocale.create).toHaveBeenCalledWith({
      data: {
        code: 'de',
        createdById: actorUserId,
        direction: 'LTR',
        englishName: 'German',
        isDefault: false,
        nativeName: 'Deutsch',
        sortOrder: 4,
        status: 'DRAFT',
        updatedById: actorUserId,
      },
      select: expect.any(Object),
    })
    expect(transaction.auditEvent.create).toHaveBeenCalledWith({
      data: {
        action: 'site-locale.created',
        actorUserId,
        entityId: 'de',
        entityType: 'SiteLocale',
        metadata: {direction: 'LTR', status: 'DRAFT'},
      },
    })
  })

  it('updates lifecycle state with optimistic audit context', async () => {
    const {database, transaction} = configuredDatabase()
    const repository = createDatabaseSiteLocaleRepository(database)

    await repository.setStatus({actorUserId, code: 'de', status: 'ACTIVE'})

    expect(transaction.siteLocale.update).toHaveBeenCalledWith({
      data: {status: 'ACTIVE', updatedById: actorUserId},
      select: expect.any(Object),
      where: {code: 'de'},
    })
    expect(transaction.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'site-locale.status-updated',
          entityId: 'de',
          metadata: {status: 'ACTIVE'},
        }),
      }),
    )
  })

  it('returns a stable projection ordered for navigation', async () => {
    const {database} = configuredDatabase()
    const repository = createDatabaseSiteLocaleRepository(database)

    await expect(repository.list()).resolves.toEqual([locale])
    expect(database.siteLocale.findMany).toHaveBeenCalledWith({
      orderBy: [{sortOrder: 'asc'}, {code: 'asc'}],
      select: expect.any(Object),
    })
  })
})
