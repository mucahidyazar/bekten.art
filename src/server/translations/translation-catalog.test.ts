import {describe, expect, it} from 'vitest'

import {
  flattenTranslationCatalog,
  mergeTranslationCatalog,
  translationArgumentNames,
  validateTranslationValue,
} from './translation-catalog'

describe('translation catalog', () => {
  it('merges localized defaults and database overrides onto the canonical key set', () => {
    const canonical = {
      navigation: {home: 'Home', works: 'Works'},
      welcome: 'Welcome, {name}',
    }
    const localized = {
      navigation: {home: 'Ana sayfa'},
    }

    expect(
      mergeTranslationCatalog({
        canonical,
        localized,
        overrides: [
          {key: 'navigation.works', value: 'Eserler'},
          {key: 'welcome', value: 'Hoş geldin, {name}'},
        ],
      }),
    ).toEqual({
      navigation: {home: 'Ana sayfa', works: 'Eserler'},
      welcome: 'Hoş geldin, {name}',
    })
    expect(flattenTranslationCatalog(localized)).toEqual({
      'navigation.home': 'Ana sayfa',
    })
  })

  it('rejects unknown keys instead of creating unsafe object paths', () => {
    expect(() =>
      mergeTranslationCatalog({
        canonical: {navigation: {home: 'Home'}},
        localized: {},
        overrides: [{key: '__proto__.polluted', value: 'yes'}],
      }),
    ).toThrow('TRANSLATION_KEY_UNKNOWN')
    expect({}).not.toHaveProperty('polluted')
  })

  it('supports the human-readable key segments already present in public/locales', () => {
    expect(
      flattenTranslationCatalog({
        contact: {workingHours: {'Monday - Friday': '09:00–18:00'}},
      }),
    ).toEqual({'contact.workingHours.Monday - Friday': '09:00–18:00'})
  })

  it('preserves top-level ICU arguments including select messages', () => {
    const source =
      '{locale, select, en {English} tr {Turkish} other {Unknown}} · {year}'

    expect(translationArgumentNames(source)).toEqual(['locale', 'year'])
    expect(
      validateTranslationValue({
        source,
        value:
          '{locale, select, en {İngilizce} tr {Türkçe} other {Bilinmiyor}} · {year}',
      }),
    ).toBe(
      '{locale, select, en {İngilizce} tr {Türkçe} other {Bilinmiyor}} · {year}',
    )
    expect(() =>
      validateTranslationValue({source, value: 'Dil · {year}'}),
    ).toThrow('TRANSLATION_ARGUMENTS_MISMATCH')
  })

  it('rejects blank and unreasonably large values at the CMS boundary', () => {
    expect(() =>
      validateTranslationValue({source: 'Home', value: '   '}),
    ).toThrow('TRANSLATION_VALUE_INVALID')
    expect(() =>
      validateTranslationValue({source: 'Home', value: 'a'.repeat(5_001)}),
    ).toThrow('TRANSLATION_VALUE_INVALID')
  })
})
