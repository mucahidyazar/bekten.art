import {beforeAll, describe, expect, it, vi} from 'vitest'

vi.mock('next-intl/server', () => ({
  getRequestConfig: (factory: unknown) => factory,
}))

describe('i18n message resolution', () => {
  let requestConfig: typeof import('../i18n').default
  let resolveMessagesLocale: (locale: string) => string

  beforeAll(async () => {
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

  it('returns Kyrgyz messages while preserving ky as the active document locale', async () => {
    const result = await requestConfig({requestLocale: Promise.resolve('ky')})

    expect(result.locale).toBe('ky')
    expect(result.messages).toHaveProperty('branding')
  })

  it('falls back to English when the request has no locale', async () => {
    const result = await requestConfig({requestLocale: Promise.resolve('')})

    expect(result.locale).toBe('en')
    expect(result.messages).toHaveProperty('branding')
  })
})
