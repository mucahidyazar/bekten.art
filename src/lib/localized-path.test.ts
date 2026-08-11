import {describe, expect, it} from 'vitest'

import {APP_LOCALES, localizedAlternates, localizedPath} from './localized-path'

describe('localized paths', () => {
  it('uses prefixless English and explicit ISO prefixes for other locales', () => {
    expect(APP_LOCALES).toEqual(['en', 'tr', 'ru', 'ky'])
    expect(localizedPath('en', '/gallery')).toBe('/gallery')
    expect(localizedPath('ky', '/gallery')).toBe('/ky/gallery')
    expect(localizedPath('de', '/gallery')).toBe('/de/gallery')
  })

  it('normalizes root and duplicate slashes', () => {
    expect(localizedPath('en', '/')).toBe('/')
    expect(localizedPath('tr', '//news/')).toBe('/tr/news')
  })

  it('removes an existing locale prefix before applying the requested locale', () => {
    expect(localizedPath('en', '/tr/works')).toBe('/works')
    expect(localizedPath('tr', '/en/works')).toBe('/tr/works')
    expect(localizedPath('de', '/tr/works')).toBe('/de/works')
  })

  it('builds canonical alternates from one public path', () => {
    expect(localizedAlternates('https://bekten.art', '/about')).toEqual({
      en: 'https://bekten.art/about',
      tr: 'https://bekten.art/tr/about',
      ru: 'https://bekten.art/ru/about',
      ky: 'https://bekten.art/ky/about',
      'x-default': 'https://bekten.art/about',
    })
  })

  it('builds alternates for the active dynamic locale registry', () => {
    expect(
      localizedAlternates('https://bekten.art', '/about', ['en', 'de']),
    ).toEqual({
      de: 'https://bekten.art/de/about',
      en: 'https://bekten.art/about',
      'x-default': 'https://bekten.art/about',
    })
  })

  it('rejects unsupported locale codes', () => {
    expect(() => localizedPath('kg', '/')).toThrow('Unsupported locale')
    expect(() => localizedPath('../de', '/')).toThrow('Unsupported locale')
  })
})
