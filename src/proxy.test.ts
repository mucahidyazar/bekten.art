import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  intlMiddleware: vi.fn(),
  next: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => mocks.intlMiddleware),
}))

vi.mock('next/server', () => ({
  NextRequest: function MockNextRequest(
    request: Record<string, unknown>,
    init: {headers: Headers},
  ) {
    return {...request, headers: init.headers}
  },
  NextResponse: {
    next: mocks.next,
    redirect: mocks.redirect,
  },
}))

describe('internationalization proxy', () => {
  let normalizeLegacyLocalePathname: (pathname: string) => string | null
  let proxy: (request: never) => unknown
  let routing: Record<string, unknown>
  let shouldBypassInternationalization: (pathname: string) => boolean

  beforeAll(async () => {
    ;({
      default: proxy,
      normalizeLegacyLocalePathname,
      routing,
      shouldBypassInternationalization,
    } = await import('./proxy'))
  })

  beforeEach(() => {
    mocks.intlMiddleware.mockReset()
    mocks.next.mockReset()
    mocks.redirect.mockReset()
  })

  it('uses explicit locale prefixes and valid ISO locale codes', () => {
    expect(routing).toEqual({
      defaultLocale: 'en',
      localePrefix: 'always',
      locales: ['en', 'tr', 'ru', 'ky'],
    })
  })

  it('permanently normalizes the legacy kg locale without changing the rest of the path', () => {
    expect(normalizeLegacyLocalePathname('/kg')).toBe('/ky')
    expect(normalizeLegacyLocalePathname('/kg/news/42')).toBe('/ky/news/42')
    expect(normalizeLegacyLocalePathname('/en/gallery')).toBeNull()
  })

  it('never internationalizes metadata, API, framework or public asset routes', () => {
    expect(shouldBypassInternationalization('/robots.txt')).toBe(true)
    expect(shouldBypassInternationalization('/sitemap.xml')).toBe(true)
    expect(shouldBypassInternationalization('/api/og')).toBe(true)
    expect(shouldBypassInternationalization('/_next/image')).toBe(true)
    expect(shouldBypassInternationalization('/link-preview.jpg')).toBe(true)
    expect(shouldBypassInternationalization('/en/gallery')).toBe(false)
  })

  it('bypasses metadata routes at runtime', () => {
    const response = {headers: {set: vi.fn()}, kind: 'next'}

    mocks.next.mockReturnValue(response)

    expect(
      proxy({headers: new Headers(), nextUrl: {pathname: '/robots.txt'}} as never),
    ).toBe(response)
    expect(mocks.intlMiddleware).not.toHaveBeenCalled()
    expect(mocks.next).toHaveBeenCalledWith({
      request: {headers: expect.any(Headers)},
    })
    expect(response.headers.set).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("script-src 'self' 'nonce-"),
    )
  })

  it('preserves query parameters during the legacy locale redirect', () => {
    const redirectUrl = {
      pathname: '/kg/news',
      search: '?page=2',
    }
    const response = {headers: {set: vi.fn()}, kind: 'redirect'}

    mocks.redirect.mockReturnValue(response)

    expect(
      proxy({
        headers: new Headers(),
        nextUrl: {
          pathname: '/kg/news',
          clone: () => redirectUrl,
        },
      } as never),
    ).toBe(response)
    expect(redirectUrl).toEqual({pathname: '/ky/news', search: '?page=2'})
    expect(mocks.redirect).toHaveBeenCalledWith(redirectUrl, 308)
  })

  it('delegates localized public routes to next-intl', () => {
    const request = {
      headers: new Headers(),
      nextUrl: {pathname: '/tr/gallery'},
    }
    const response = {headers: {set: vi.fn()}, kind: 'intl'}

    mocks.intlMiddleware.mockReturnValue(response)

    expect(proxy(request as never)).toBe(response)
    expect(mocks.intlMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.any(Headers),
        nextUrl: request.nextUrl,
      }),
    )
    const securedRequest = mocks.intlMiddleware.mock.calls[0]?.[0] as {
      headers: Headers
    }

    expect(securedRequest.headers.get('x-nonce')).toMatch(/^[a-f0-9]{32}$/)
    expect(securedRequest.headers.get('Content-Security-Policy')).toContain(
      "frame-ancestors 'none'",
    )
  })
})
