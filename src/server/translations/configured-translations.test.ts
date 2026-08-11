import {describe, expect, it} from 'vitest'

import {shouldRethrowTranslationError} from './configured-translations'

describe('configured translation fallback policy', () => {
  it('fails closed for unknown or inactive public locales', () => {
    expect(
      shouldRethrowTranslationError(new Error('SITE_LOCALE_NOT_FOUND')),
    ).toBe(true)
    expect(
      shouldRethrowTranslationError(new Error('SITE_LOCALE_NOT_ACTIVE')),
    ).toBe(true)
  })

  it('allows the static catalogue when the database layer is unavailable', () => {
    expect(
      shouldRethrowTranslationError(
        new TypeError("Cannot read properties of undefined (reading 'findMany')"),
      ),
    ).toBe(false)
  })
})
