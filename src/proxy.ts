import {NextRequest, NextResponse} from 'next/server'

import createMiddleware from 'next-intl/middleware'

import {APP_LOCALES, isSafeLocaleCode} from '@/lib/localized-path'
import {buildContentSecurityPolicy} from '@/server/security/content-security-policy'

const routingConfig = {
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

export function isInternalDefaultLocaleRewrite(
  pathname: string,
  originalPathname: string | null,
) {
  if (!originalPathname) return false

  if (pathname === '/en') return originalPathname === '/'
  if (!pathname.startsWith('/en/')) return false

  return pathname.slice(3) === originalPathname
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
    request,
  }
}

function withSecurityRequestHeaders(
  response: NextResponse,
  requestHeaders: Headers,
) {
  if (!response.ok) return response

  const rewriteDestination = response.headers.get('x-middleware-rewrite')
  const init = {
    headers: response.headers,
    request: {headers: requestHeaders},
  }

  return rewriteDestination
    ? NextResponse.rewrite(
        canonicalInternalRewriteDestination(rewriteDestination),
        init,
      )
    : NextResponse.next(init)
}

function canonicalInternalRewriteDestination(rewriteDestination: string) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (!configuredAppUrl) return rewriteDestination

  try {
    const destination = new URL(rewriteDestination)
    const canonicalOrigin = new URL(configuredAppUrl)

    if (!['http:', 'https:'].includes(canonicalOrigin.protocol)) {
      return rewriteDestination
    }

    destination.protocol = canonicalOrigin.protocol
    destination.host = canonicalOrigin.host

    return destination.toString()
  } catch {
    return rewriteDestination
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
  const originalPathname = request.headers.get('x-pathname')
  const security = createSecurityContext(request)

  if (
    isInternalDefaultLocaleRewrite(
      request.nextUrl.pathname,
      originalPathname,
    )
  ) {
    return withContentSecurityPolicy(
      NextResponse.next({request: {headers: security.headers}}),
      security.policy,
    )
  }

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
    withSecurityRequestHeaders(
      intlMiddleware(security.request),
      security.headers,
    ),
    security.policy,
  )
}
