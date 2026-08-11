import {describe, expect, it, vi} from 'vitest'

import {createPublicSiteLocaleRegistry} from './public-site-locales'

const fallback = Object.freeze([
  {
    code: 'en',
    direction: 'LTR' as const,
    englishName: 'English',
    nativeName: 'English',
    sortOrder: 0,
    status: 'ACTIVE' as const,
  },
])

describe('public site locale registry', () => {
  it('exposes active database locales in stable order', async () => {
    const registry = createPublicSiteLocaleRegistry({
      fallback,
      load: vi.fn().mockResolvedValue([
        {...fallback[0], code: 'de', nativeName: 'Deutsch', sortOrder: 2},
        fallback[0],
      ]),
    })

    await expect(registry.list()).resolves.toEqual([
      fallback[0],
      {...fallback[0], code: 'de', nativeName: 'Deutsch', sortOrder: 2},
    ])
    await expect(registry.resolve('de')).resolves.toMatchObject({
      code: 'de',
      nativeName: 'Deutsch',
    })
  })

  it('fails closed to built-in active locales when the database is unavailable', async () => {
    const registry = createPublicSiteLocaleRegistry({
      fallback,
      load: vi.fn().mockRejectedValue(new Error('DATABASE_UNAVAILABLE')),
    })

    await expect(registry.list()).resolves.toEqual(fallback)
    await expect(registry.resolve('de')).resolves.toBeNull()
  })
})
