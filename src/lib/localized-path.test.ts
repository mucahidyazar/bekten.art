import {describe, expect, it} from 'vitest'

import {
  APP_LOCALES,
  localizedAlternates,
  localizedPath,
} from './localized-path'

describe('localized paths', () => {
  it('uses valid, explicit ISO locale prefixes', () => {
    expect(APP_LOCALES).toEqual(['en', 'tr', 'ru', 'ky'])
    expect(localizedPath('ky', '/gallery')).toBe('/ky/gallery')
  })

  it('normalizes root and duplicate slashes', () => {
    expect(localizedPath('en', '/')).toBe('/en')
    expect(localizedPath('tr', '//news/')).toBe('/tr/news')
  })

  it('builds canonical alternates from one public path', () => {
    expect(
      localizedAlternates('https://bekten.art', '/about'),
    ).toEqual({
      en: 'https://bekten.art/en/about',
      tr: 'https://bekten.art/tr/about',
      ru: 'https://bekten.art/ru/about',
      ky: 'https://bekten.art/ky/about',
      'x-default': 'https://bekten.art/en/about',
    })
  })

  it('rejects unsupported locale codes', () => {
    expect(() => localizedPath('kg' as 'en', '/')).toThrow(
      'Unsupported locale',
    )
  })
})
