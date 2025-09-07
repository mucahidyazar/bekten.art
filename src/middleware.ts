import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales: ['en', 'tr', 'ru', 'kg'],
  defaultLocale: 'en',
  localePrefix: 'never' // This will keep URLs without locale prefix
})

// Protected routes that require authentication
const protectedRoutes = [
  '/admin',
  '/profile',
  '/store/create'
]

// Admin only routes
const adminRoutes = [
  '/admin'
]

// Public routes that authenticated users should be redirected from
const authRoutes = [
  '/sign-in',
  '/sign-up'
]

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (auth callback route)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mov|avi|webm|ogg|webmanifest)$).*)',
  ],
}

export async function middleware(request: NextRequest) {
  // First, handle internationalization
  const intlResponse = intlMiddleware(request)

  // If intl middleware wants to redirect, let it
  if (intlResponse && intlResponse.status !== 200) {
    return intlResponse
  }

  // Then handle Supabase auth
  let supabaseResponse = intlResponse || NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user and refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl
  const pathname = url.pathname

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/sign-in', request.url)

    redirectUrl.searchParams.set('redirect', pathname)

    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user) {
    const redirectTo = url.searchParams.get('redirect') || '/'

    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Check admin access for admin routes
  if (isAdminRoute && user) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role?.toLowerCase() !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      console.error('Error checking admin status:', error)

      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}
