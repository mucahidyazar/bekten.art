import {NextRequest, NextResponse} from 'next/server'

import createMiddleware from 'next-intl/middleware'

import {APP_LOCALES, isSafeLocaleCode} from '@/lib/localized-path'
import {buildContentSecurityPolicy} from '@/server/security/content-security-policy'

const routingConfig = {
  alternateLinks: false,
  defaultLocale: 'en',
  localeDetection: false,
  localePrefix: 'as-needed',
  locales: [...APP_LOCALES],
} as const

const intlMiddleware = createMiddleware(routingConfig)
const PUBLIC_FILE_PATTERN = /\/[^/]+\.[^/]+$/
const LOCALIZED_DASHBOARD_PATTERN =
  /^\/(?<locale>[^/]+)\/dashboard(?<suffix>\/.*)?$/u

export const config = {
  matcher: [
    '/((?!api(?:/|$)|_next(?:/|$)|robots\\.txt$|sitemap\\.xml$|favicon\\.ico$|.*\\.[^/]+$).*)',
  ],
}

export function isDynamicLocalePathname(pathname: string) {
  const candidate = pathname.split('/').filter(Boolean)[0]

  return Boolean(
    candidate &&
      candidate !== 'kg' &&
      !APP_LOCALES.some(locale => locale === candidate) &&
      isSafeLocaleCode(candidate),
  )
}

export function normalizeDefaultLocalePathname(pathname: string) {
  if (pathname === '/en') return '/'
  if (!pathname.startsWith('/en/')) return null

  const prefixless = pathname.slice(3)

  if (prefixless === '/news') return '/journal'
  if (prefixless.startsWith('/news/')) {
    return `/journal${prefixless.slice('/news'.length)}`
  }
  if (prefixless === '/gallery') return '/works'
  if (prefixless === '/artist') return '/about'

  return prefixless
}

export function normalizeLegacyLocalePathname(pathname: string) {
  if (pathname === '/kg') {
    return '/ky'
  }

  if (pathname.startsWith('/kg/')) {
    return `/ky${pathname.slice(3)}`
  }

  return null
}

export function normalizeLocalizedDashboardPathname(pathname: string) {
  const match = LOCALIZED_DASHBOARD_PATTERN.exec(pathname)

  if (
    !match ||
    (!isSafeLocaleCode(match.groups?.locale ?? '') &&
      match.groups?.locale !== 'kg')
  ) {
    return null
  }

  return `/dashboard${match.groups?.suffix ?? ''}`
}

export const routing = routingConfig

function createSecurityContext(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll('-', '')
  const policy = buildContentSecurityPolicy({
    mediaOrigin: process.env.MEDIA_S3_ENDPOINT,
    nonce,
    production: process.env.NODE_ENV === 'production',
  })
  const headers = new Headers(request.headers)

  headers.set('Content-Security-Policy', policy)
  headers.set('x-nonce', nonce)
  headers.set('x-pathname', request.nextUrl.pathname)

  return {
    headers,
    policy,
    request: new NextRequest(request, {headers}),
  }
}

function withContentSecurityPolicy<T extends NextResponse>(
  response: T,
  policy: string,
) {
  response.headers.set('Content-Security-Policy', policy)

  return response
}

export function shouldBypassInternationalization(pathname: string) {
  return (
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/') ||
    pathname === '/api' ||
    pathname.startsWith('/_next/') ||
    pathname === '/_next' ||
    PUBLIC_FILE_PATTERN.test(pathname)
  )
}

export default function proxy(request: NextRequest) {
  const security = createSecurityContext(request)

  if (shouldBypassInternationalization(request.nextUrl.pathname)) {
    return withContentSecurityPolicy(
      NextResponse.next({request: {headers: security.request.headers}}),
      security.policy,
    )
  }

  const canonicalPathname =
    normalizeDefaultLocalePathname(request.nextUrl.pathname) ??
    normalizeLocalizedDashboardPathname(request.nextUrl.pathname) ??
    normalizeLegacyLocalePathname(request.nextUrl.pathname)

  if (canonicalPathname) {
    const redirectUrl = request.nextUrl.clone()

    redirectUrl.pathname = canonicalPathname

    return withContentSecurityPolicy(
      NextResponse.redirect(redirectUrl, 308),
      security.policy,
    )
  }

  if (isDynamicLocalePathname(request.nextUrl.pathname)) {
    return withContentSecurityPolicy(
      NextResponse.next({request: {headers: security.headers}}),
      security.policy,
    )
  }

  return withContentSecurityPolicy(
    intlMiddleware(security.request),
    security.policy,
  )
}
