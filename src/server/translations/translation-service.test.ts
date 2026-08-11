import {describe, expect, it, vi} from 'vitest'

import {createTranslationService} from './translation-service'

const catalogs = Object.freeze({
  en: Object.freeze({navigation: {home: 'Home', works: 'Works'}}),
  ky: Object.freeze({navigation: {home: 'Башкы бет'}}),
  ru: Object.freeze({navigation: {home: 'Главная', works: 'Работы'}}),
  tr: Object.freeze({navigation: {home: 'Ana sayfa', works: 'Çalışmalar'}}),
})

describe('translation service', () => {
  it('builds a four-language workspace and merged public messages', async () => {
    const repository = {
      list: vi
        .fn()
        .mockResolvedValue([
          {key: 'navigation.works', locale: 'tr', value: 'Eserler'},
        ]),
      replaceKey: vi.fn(),
    }
    const service = createTranslationService({catalogs, repository})

    await expect(service.messages('tr')).resolves.toEqual({
      navigation: {home: 'Ana sayfa', works: 'Eserler'},
    })
    await expect(service.workspace()).resolves.toMatchObject({
      entries: [
        {
          key: 'navigation.home',
          section: 'navigation',
          values: {
            en: {
              customized: false,
              defaultValue: 'Home',
              missing: false,
              value: 'Home',
            },
            ky: {
              customized: false,
              defaultValue: 'Башкы бет',
              missing: false,
              value: 'Башкы бет',
            },
            ru: {
              customized: false,
              defaultValue: 'Главная',
              missing: false,
              value: 'Главная',
            },
            tr: {
              customized: false,
              defaultValue: 'Ana sayfa',
              missing: false,
              value: 'Ana sayfa',
            },
          },
        },
        {
          key: 'navigation.works',
          section: 'navigation',
          values: {
            en: {
              customized: false,
              defaultValue: 'Works',
              missing: false,
              value: 'Works',
            },
            ky: {
              customized: false,
              defaultValue: 'Works',
              missing: true,
              value: 'Works',
            },
            ru: {
              customized: false,
              defaultValue: 'Работы',
              missing: false,
              value: 'Работы',
            },
            tr: {
              customized: true,
              defaultValue: 'Çalışmalar',
              missing: false,
              value: 'Eserler',
            },
          },
        },
      ],
      sections: ['navigation'],
    })
  })

  it('stores only validated differences from the file-backed defaults', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue([]),
      replaceKey: vi.fn().mockResolvedValue(undefined),
    }
    const service = createTranslationService({catalogs, repository})

    await service.saveRow({
      actorUserId: '00000000-0000-4000-8000-000000000001',
      key: 'navigation.works',
      values: {
        en: 'Works',
        ky: 'Эмгектер',
        ru: 'Работы',
        tr: 'Eserler',
      },
    })

    expect(repository.replaceKey).toHaveBeenCalledWith({
      actorUserId: '00000000-0000-4000-8000-000000000001',
      key: 'navigation.works',
      overrides: [
        {locale: 'tr', value: 'Eserler'},
        {locale: 'ky', value: 'Эмгектер'},
      ],
    })
  })

  it('builds newly registered languages from English fallback and database values', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue([
        {key: 'navigation.home', locale: 'de', value: 'Startseite'},
      ]),
      replaceKey: vi.fn().mockResolvedValue(undefined),
    }
    const service = createTranslationService({
      catalogs,
      locales: [
        {
          code: 'en',
          direction: 'LTR',
          englishName: 'English',
          nativeName: 'English',
          sortOrder: 0,
          status: 'ACTIVE',
        },
        {
          code: 'de',
          direction: 'LTR',
          englishName: 'German',
          nativeName: 'Deutsch',
          sortOrder: 4,
          status: 'ACTIVE',
        },
      ],
      repository,
    })

    await expect(service.messages('de')).resolves.toEqual({
      navigation: {home: 'Startseite', works: 'Works'},
    })
    await expect(service.workspace()).resolves.toMatchObject({
      locales: [
        {code: 'en', nativeName: 'English'},
        {code: 'de', nativeName: 'Deutsch'},
      ],
      entries: [
        {
          key: 'navigation.home',
          values: {
            de: {
              customized: true,
              defaultValue: 'Home',
              missing: false,
              value: 'Startseite',
            },
          },
        },
        {
          key: 'navigation.works',
          values: {
            de: {
              customized: false,
              defaultValue: 'Works',
              missing: true,
              value: 'Works',
            },
          },
        },
      ],
    })

    await service.saveRow({
      actorUserId: '00000000-0000-4000-8000-000000000001',
      key: 'navigation.works',
      values: {de: 'Werke', en: 'Works'},
    })
    expect(repository.replaceKey).toHaveBeenCalledWith({
      actorUserId: '00000000-0000-4000-8000-000000000001',
      key: 'navigation.works',
      overrides: [{locale: 'de', value: 'Werke'}],
    })
  })

  it.each(['DRAFT', 'DISABLED'] as const)(
    'keeps %s languages private from public message loading',
    async status => {
      const service = createTranslationService({
        catalogs,
        locales: [
          {
            code: 'en',
            direction: 'LTR',
            englishName: 'English',
            nativeName: 'English',
            sortOrder: 0,
            status: 'ACTIVE',
          },
          {
            code: 'de',
            direction: 'LTR',
            englishName: 'German',
            nativeName: 'Deutsch',
            sortOrder: 4,
            status,
          },
        ],
        repository: {list: vi.fn(), replaceKey: vi.fn()},
      })

      await expect(service.messages('de')).rejects.toThrow(
        'SITE_LOCALE_NOT_ACTIVE',
      )
    },
  )
})
