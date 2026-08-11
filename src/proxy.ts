import {NextRequest, NextResponse} from 'next/server'

import createMiddleware from 'next-intl/middleware'

import {APP_LOCALES} from '@/lib/localized-path'
import {buildContentSecurityPolicy} from '@/server/security/content-security-policy'

const routingConfig = {
  defaultLocale: 'en',
  localeDetection: false,
  localePrefix: 'as-needed',
  locales: [...APP_LOCALES],
} as const

const intlMiddleware = createMiddleware(routingConfig)
const PUBLIC_FILE_PATTERN = /\/[^/]+\.[^/]+$/
const PREFIXLESS_LEGACY_ROUTES = Object.freeze({
  '/artist': '/about',
  '/gallery': '/works',
  '/news': '/journal',
})

export const config = {
  matcher: [
    '/((?!api(?:/|$)|_next(?:/|$)|robots\\.txt$|sitemap\\.xml$|favicon\\.ico$|.*\\.[^/]+$).*)',
  ],
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

export function normalizePrefixedEnglishPathname(pathname: string) {
  if (pathname === '/en') return '/'

  if (pathname.startsWith('/en/')) {
    const prefixlessPathname = pathname.slice(3)

    if (prefixlessPathname.startsWith('/news/')) {
      return `/journal${prefixlessPathname.slice('/news'.length)}`
    }

    return (
      PREFIXLESS_LEGACY_ROUTES[
        prefixlessPathname as keyof typeof PREFIXLESS_LEGACY_ROUTES
      ] ?? prefixlessPathname
    )
  }

  return null
}

export const routing = routingConfig

function createSecurityContext(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll('-', '')
  const policy = buildContentSecurityPolicy({
    nonce,
    production: process.env.NODE_ENV === 'production',
  })
  const headers = new Headers(request.headers)

  headers.set('Content-Security-Policy', policy)
  headers.set('x-nonce', nonce)
  headers.set('x-pathname', request.nextUrl.pathname)

  return {
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
    normalizePrefixedEnglishPathname(request.nextUrl.pathname) ??
    normalizeLegacyLocalePathname(request.nextUrl.pathname)

  if (canonicalPathname) {
    const redirectUrl = request.nextUrl.clone()

    redirectUrl.pathname = canonicalPathname

    return withContentSecurityPolicy(
      NextResponse.redirect(redirectUrl, 308),
      security.policy,
    )
  }

  return withContentSecurityPolicy(
    intlMiddleware(security.request),
    security.policy,
  )
}
