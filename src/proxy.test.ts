import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  intlMiddleware: vi.fn(),
  next: vi.fn(),
  redirect: vi.fn(),
  rewrite: vi.fn(),
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
    rewrite: mocks.rewrite,
  },
}))

describe('internationalization proxy', () => {
  let normalizeLocalizedDashboardPathname: (pathname: string) => string | null
  let normalizeDefaultLocalePathname: (pathname: string) => string | null
  let normalizeLegacyLocalePathname: (pathname: string) => string | null
  let proxy: (request: never) => unknown
  let routing: Record<string, unknown>
  let shouldBypassInternationalization: (pathname: string) => boolean

  beforeEach(async () => {
    vi.resetModules()
    ;({
      default: proxy,
      normalizeDefaultLocalePathname,
      normalizeLocalizedDashboardPathname,
      normalizeLegacyLocalePathname,
      routing,
      shouldBypassInternationalization,
    } = await import('./proxy'))
    mocks.intlMiddleware.mockReset()
    mocks.next.mockReset()
    mocks.redirect.mockReset()
    mocks.rewrite.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keeps English prefixless and uses explicit valid prefixes for other locales', () => {
    expect(routing).toEqual({
      defaultLocale: 'en',
      localeDetection: false,
      localePrefix: 'as-needed',
      locales: ['en', 'tr', 'ru', 'ky'],
    })
  })

  it('collapses locale-prefixed dashboard routes to the canonical prefixless workspace path', () => {
    expect(normalizeLocalizedDashboardPathname('/tr/dashboard')).toBe(
      '/dashboard',
    )
    expect(normalizeLocalizedDashboardPathname('/ky/dashboard/sign-in')).toBe(
      '/dashboard/sign-in',
    )
    expect(normalizeLocalizedDashboardPathname('/de/dashboard/users')).toBe(
      '/dashboard/users',
    )
    expect(normalizeLocalizedDashboardPathname('/ru/works')).toBeNull()
  })

  it('permanently normalizes the legacy kg locale without changing the rest of the path', () => {
    expect(normalizeLegacyLocalePathname('/kg')).toBe('/ky')
    expect(normalizeLegacyLocalePathname('/kg/news/42')).toBe('/ky/news/42')
    expect(normalizeLegacyLocalePathname('/en/gallery')).toBeNull()
  })

  it('normalizes explicit English URLs directly to their prefixless canonical route', () => {
    expect(normalizeDefaultLocalePathname('/en')).toBe('/')
    expect(normalizeDefaultLocalePathname('/en/works')).toBe('/works')
    expect(normalizeDefaultLocalePathname('/en/news')).toBe('/journal')
    expect(normalizeDefaultLocalePathname('/en/news/studio-note')).toBe(
      '/journal/studio-note',
    )
    expect(normalizeDefaultLocalePathname('/tr/works')).toBeNull()
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
      proxy({
        headers: new Headers(),
        nextUrl: {pathname: '/robots.txt'},
      } as never),
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

  it('permanently redirects locale-prefixed dashboard URLs without losing query parameters', () => {
    const redirectUrl = {
      pathname: '/tr/dashboard/sign-in',
      search: '?callbackUrl=%2Ftr%2Fdashboard',
    }
    const response = {headers: {set: vi.fn()}, kind: 'redirect'}

    mocks.redirect.mockReturnValue(response)

    expect(
      proxy({
        headers: new Headers(),
        nextUrl: {
          pathname: '/tr/dashboard/sign-in',
          clone: () => redirectUrl,
        },
      } as never),
    ).toBe(response)
    expect(redirectUrl).toEqual({
      pathname: '/dashboard/sign-in',
      search: '?callbackUrl=%2Ftr%2Fdashboard',
    })
    expect(mocks.redirect).toHaveBeenCalledWith(redirectUrl, 308)
    expect(mocks.intlMiddleware).not.toHaveBeenCalled()
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
      expect.objectContaining({nextUrl: request.nextUrl}),
    )
    expect(response.headers.set).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("frame-ancestors 'none'"),
    )
  })

  it('lets a safe dynamic locale route reach the locale layout for registry validation', () => {
    const request = {
      headers: new Headers(),
      nextUrl: {pathname: '/de/works'},
    }
    const response = {headers: {set: vi.fn()}, kind: 'next'}

    mocks.next.mockReturnValue(response)

    expect(proxy(request as never)).toBe(response)
    expect(mocks.intlMiddleware).not.toHaveBeenCalled()
    expect(mocks.next).toHaveBeenCalledWith({
      request: {headers: expect.any(Headers)},
    })
  })

  it('delegates prefixless English routes to next-intl', () => {
    const request = {
      headers: new Headers(),
      nextUrl: {pathname: '/works'},
    }
    const response = {headers: {set: vi.fn()}, kind: 'intl'}

    mocks.intlMiddleware.mockReturnValue(response)

    expect(proxy(request as never)).toBe(response)
    expect(mocks.intlMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({nextUrl: request.nextUrl}),
    )
  })

  it('permanently normalizes a directly prefixed English route without losing its query', () => {
    const redirectUrl = {pathname: '/en/works', search: '?view=grid'}
    const request = {
      headers: new Headers(),
      nextUrl: {pathname: '/en/works', clone: () => redirectUrl},
    }
    const response = {headers: {set: vi.fn()}, kind: 'redirect'}

    mocks.redirect.mockReturnValue(response)

    expect(proxy(request as never)).toBe(response)
    expect(redirectUrl).toEqual({pathname: '/works', search: '?view=grid'})
    expect(mocks.redirect).toHaveBeenCalledWith(redirectUrl, 308)
    expect(mocks.intlMiddleware).not.toHaveBeenCalled()
  })

  it('bypasses next-intl only when a prefixed English pathname is its own internal rewrite target', () => {
    const request = {
      headers: new Headers({'x-pathname': '/works'}),
      nextUrl: {pathname: '/en/works'},
    }
    const response = {headers: {set: vi.fn()}, kind: 'next'}

    mocks.next.mockReturnValue(response)

    expect(proxy(request as never)).toBe(response)
    expect(mocks.intlMiddleware).not.toHaveBeenCalled()
    expect(mocks.next).toHaveBeenCalledWith({
      request: {headers: expect.any(Headers)},
    })
  })

  it('preserves the next-intl rewrite while forwarding nonce headers on the request', () => {
    const request = {
      headers: new Headers(),
      nextUrl: {pathname: '/works'},
    }
    const intlHeaders = new Headers({
      'x-middleware-rewrite': 'http://localhost:3000/en/works',
    })
    const intlResponse = {headers: intlHeaders, ok: true}

    mocks.intlMiddleware.mockReturnValue(intlResponse)

    expect(proxy(request as never)).toBe(intlResponse)
    expect(mocks.rewrite).not.toHaveBeenCalled()

    const forwardedRequest = mocks.intlMiddleware.mock.calls[0]?.[0] as {
      headers: Headers
    }

    expect(forwardedRequest).not.toBe(request)
    expect(forwardedRequest.headers.get('x-nonce')).toMatch(/^[a-f0-9]{32}$/u)
    expect(forwardedRequest.headers.get('x-pathname')).toBe('/works')
  })
})
