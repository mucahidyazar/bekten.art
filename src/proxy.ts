import {NextResponse, type NextRequest} from 'next/server'

import createMiddleware from 'next-intl/middleware'

import {auth} from '@/auth'

const intlMiddleware = createMiddleware({
  defaultLocale: 'en',
  localePrefix: 'never',
  locales: ['en', 'tr', 'ru', 'kg'],
})

const protectedRoutes = ['/admin', '/profile', '/store/create']
const adminRoutes = ['/admin']
const authRoutes = ['/sign-in', '/sign-up']

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mov|avi|webm|ogg|webmanifest)$).*)',
  ],
}

export default auth(request => {
  const authRequest = request as NextRequest & {
    auth?: {
      user?: {
        role?: string | null
      }
    }
  }
  const intlResponse = intlMiddleware(authRequest)

  if (intlResponse && intlResponse.status !== 200) {
    return intlResponse
  }

  const pathname = authRequest.nextUrl.pathname
  const isAuthenticated = Boolean(authRequest.auth?.user)
  const role = authRequest.auth?.user?.role?.toLowerCase()
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route),
  )
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/sign-in', authRequest.url)

    redirectUrl.searchParams.set('redirect', pathname)

    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && isAuthenticated) {
    const redirectTo = authRequest.nextUrl.searchParams.get('redirect') || '/'

    return NextResponse.redirect(new URL(redirectTo, authRequest.url))
  }

  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/', authRequest.url))
  }

  return intlResponse || NextResponse.next()
})
