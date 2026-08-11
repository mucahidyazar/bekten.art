import {describe, expect, it, vi} from 'vitest'

import {createDatabaseTranslationRepository} from './database-translation-repository'

describe('database translation repository', () => {
  it('replaces one key atomically and records a value-free audit event', async () => {
    const transaction = {
      auditEvent: {create: vi.fn().mockResolvedValue({id: 'audit-1'})},
      uiTranslationOverride: {
        createMany: vi.fn().mockResolvedValue({count: 2}),
        deleteMany: vi.fn().mockResolvedValue({count: 1}),
      },
    }
    const database = {
      $transaction: vi.fn(callback => callback(transaction)),
      uiTranslationOverride: {findMany: vi.fn()},
    }
    const repository = createDatabaseTranslationRepository(database)

    await repository.replaceKey({
      actorUserId: '00000000-0000-4000-8000-000000000001',
      key: 'navigation.works',
      overrides: [
        {locale: 'tr', value: 'Eserler'},
        {locale: 'ky', value: 'Эмгектер'},
      ],
    })

    expect(transaction.uiTranslationOverride.deleteMany).toHaveBeenCalledWith({
      where: {key: 'navigation.works'},
    })
    expect(transaction.uiTranslationOverride.createMany).toHaveBeenCalledWith({
      data: [
        {
          key: 'navigation.works',
          locale: 'tr',
          updatedByUserId: '00000000-0000-4000-8000-000000000001',
          value: 'Eserler',
        },
        {
          key: 'navigation.works',
          locale: 'ky',
          updatedByUserId: '00000000-0000-4000-8000-000000000001',
          value: 'Эмгектер',
        },
      ],
    })
    expect(transaction.auditEvent.create).toHaveBeenCalledWith({
      data: {
        action: 'translation.updated',
        actorUserId: '00000000-0000-4000-8000-000000000001',
        entityId: null,
        entityType: 'UiTranslation',
        metadata: {key: 'navigation.works', locales: ['tr', 'ky']},
      },
    })
    expect(
      JSON.stringify(transaction.auditEvent.create.mock.calls),
    ).not.toContain('Eserler')
  })

  it('lists only the requested locale with a stable projection', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([
        {key: 'navigation.works', locale: 'tr', value: 'Eserler'},
      ])
    const repository = createDatabaseTranslationRepository({
      $transaction: vi.fn(),
      uiTranslationOverride: {findMany},
    })

    await expect(repository.list('tr')).resolves.toEqual([
      {key: 'navigation.works', locale: 'tr', value: 'Eserler'},
    ])
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{key: 'asc'}, {locale: 'asc'}],
      select: {key: true, locale: true, value: true},
      where: {locale: 'tr'},
    })
  })

  it('accepts existing human-readable catalogue keys at the database boundary', async () => {
    const transaction = {
      auditEvent: {create: vi.fn().mockResolvedValue({id: 'audit-1'})},
      uiTranslationOverride: {
        createMany: vi.fn().mockResolvedValue({count: 1}),
        deleteMany: vi.fn().mockResolvedValue({count: 0}),
      },
    }
    const repository = createDatabaseTranslationRepository({
      $transaction: vi.fn(callback => callback(transaction)),
      uiTranslationOverride: {findMany: vi.fn()},
    })

    await expect(
      repository.replaceKey({
        actorUserId: '00000000-0000-4000-8000-000000000001',
        key: 'contact.workingHours.Monday - Friday',
        overrides: [{locale: 'tr', value: '09.00–18.00'}],
      }),
    ).resolves.toBeUndefined()
  })

  it('accepts a normalized locale created through the locale registry', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {key: 'navigation.works', locale: 'pt-BR', value: 'Trabalhos'},
    ])
    const repository = createDatabaseTranslationRepository({
      $transaction: vi.fn(),
      uiTranslationOverride: {findMany},
    })

    await expect(repository.list('pt-BR')).resolves.toEqual([
      {key: 'navigation.works', locale: 'pt-BR', value: 'Trabalhos'},
    ])
  })
})
