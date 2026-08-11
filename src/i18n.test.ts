import {beforeAll, describe, expect, it, vi} from 'vitest'

const translations = vi.hoisted(() => ({loadPublicMessages: vi.fn()}))

vi.mock('next-intl/server', () => ({
  getRequestConfig: (factory: unknown) => factory,
}))
vi.mock('@/server/translations/configured-translations', () => translations)

describe('i18n message resolution', () => {
  let requestConfig: typeof import('../i18n').default
  let resolveMessagesLocale: (locale: string) => string

  beforeAll(async () => {
    translations.loadPublicMessages.mockImplementation((locale: string) => ({
      branding: {locale},
    }))
    ;({default: requestConfig, resolveMessagesLocale} = await import('../i18n'))
  })

  it('serves the existing Kyrgyz catalogue under the ISO 639-1 ky route', () => {
    expect(resolveMessagesLocale('ky')).toBe('kg')
  })

  it('rejects unsupported locale values instead of importing arbitrary paths', () => {
    expect(() => resolveMessagesLocale('../../secrets')).toThrow(
      'Unsupported locale',
    )
  })

  it('accepts a safe dashboard-registered locale code', () => {
    expect(resolveMessagesLocale('de')).toBe('de')
  })

  it('returns Kyrgyz messages while preserving ky as the active document locale', async () => {
    const result = await requestConfig({requestLocale: Promise.resolve('ky')})

    expect(result.locale).toBe('ky')
    expect(result.messages).toHaveProperty('branding')
    expect(translations.loadPublicMessages).toHaveBeenCalledWith('ky')
  })

  it('falls back to English when the request has no locale', async () => {
    const result = await requestConfig({requestLocale: Promise.resolve('')})

    expect(result.locale).toBe('en')
    expect(result.messages).toHaveProperty('branding')
  })
})
