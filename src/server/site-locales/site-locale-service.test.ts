import {describe, expect, it, vi} from 'vitest'

import {
  createSiteLocaleService,
  normalizeSiteLocaleCode,
} from './site-locale-service'

import type {SiteLocaleRepository} from './site-locale-service'

const english = Object.freeze({
  code: 'en',
  direction: 'LTR' as const,
  englishName: 'English',
  nativeName: 'English',
  sortOrder: 0,
  status: 'ACTIVE' as const,
})

function repository(
  overrides: Partial<SiteLocaleRepository> = {},
): SiteLocaleRepository {
  return {
    create: vi.fn(async input => ({...input, status: 'DRAFT' as const})),
    find: vi.fn(async code => (code === 'en' ? english : null)),
    list: vi.fn(async () => [english]),
    setStatus: vi.fn(async input => ({...english, ...input})),
    ...overrides,
  }
}

describe('site locale service', () => {
  it.each([
    ['EN', 'en'],
    ['pt-br', 'pt-BR'],
    ['zh-Hant', 'zh-Hant'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeSiteLocaleCode(input)).toBe(expected)
  })

  it.each(['e', 'english', '../tr', 'tr_TR', 'en-US-extra-part']) (
    'rejects the invalid locale code %s',
    input => {
      expect(() => normalizeSiteLocaleCode(input)).toThrow(
        'SITE_LOCALE_CODE_INVALID',
      )
    },
  )

  it('creates a new locale as a disabled draft with normalized metadata', async () => {
    const store = repository({find: vi.fn(async () => null)})
    const service = createSiteLocaleService(store)

    await expect(
      service.create({
        actorUserId: '10000000-0000-4000-8000-000000000001',
        code: 'pt-br',
        direction: 'LTR',
        englishName: 'Brazilian Portuguese',
        nativeName: 'Português do Brasil',
        sortOrder: 4,
      }),
    ).resolves.toMatchObject({code: 'pt-BR', status: 'DRAFT'})
    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({code: 'pt-BR', status: 'DRAFT'}),
    )
  })

  it('rejects duplicate locales before writing', async () => {
    const store = repository()
    const service = createSiteLocaleService(store)

    await expect(
      service.create({
        actorUserId: '10000000-0000-4000-8000-000000000001',
        code: 'en',
        direction: 'LTR',
        englishName: 'English',
        nativeName: 'English',
        sortOrder: 0,
      }),
    ).rejects.toThrow('SITE_LOCALE_EXISTS')
    expect(store.create).not.toHaveBeenCalled()
  })

  it('never allows the default English locale to be disabled', async () => {
    const store = repository()
    const service = createSiteLocaleService(store)

    await expect(
      service.setStatus({
        actorUserId: '10000000-0000-4000-8000-000000000001',
        code: 'en',
        status: 'DISABLED',
      }),
    ).rejects.toThrow('DEFAULT_SITE_LOCALE_REQUIRED')
    expect(store.setStatus).not.toHaveBeenCalled()
  })

  it('lists only active locales for public routing', async () => {
    const store = repository({
      list: vi.fn(async () => [
        english,
        {
          ...english,
          code: 'de',
          englishName: 'German',
          status: 'DRAFT' as const,
        },
        {
          ...english,
          code: 'tr',
          englishName: 'Turkish',
          status: 'ACTIVE' as const,
        },
      ]),
    })
    const service = createSiteLocaleService(store)

    await expect(service.listActive()).resolves.toEqual([
      english,
      {
        ...english,
        code: 'tr',
        englishName: 'Turkish',
        status: 'ACTIVE' as const,
      },
    ])
  })
})
