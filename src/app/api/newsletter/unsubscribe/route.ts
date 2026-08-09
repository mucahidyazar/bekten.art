import {NextResponse} from 'next/server'

import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {getConfiguredNewsletterService} from '@/server/email/configured-newsletter-service'
import {getPublicAppOrigin} from '@/server/email/public-api'
import {
  readBoundedText,
  RequestBodyTooLargeError,
} from '@/server/http/bounded-body'

const COOKIE_NAME = 'bekten_newsletter_unsubscribe'
const LOCALE_COOKIE = 'bekten_email_action_locale'
const TOKEN_PATTERN = /^[A-Za-z0-9._-]{20,2048}$/u
const LOCALES = new Set(['en', 'tr', 'ru', 'ky'])

function readCookie(request: Request, name: string) {
  return (request.headers.get('cookie') ?? '')
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

function locale(value: string | null | undefined) {
  return value && LOCALES.has(value) ? value : 'en'
}

function resultRedirect(path: string) {
  const response = NextResponse.redirect(new URL(path, getPublicAppOrigin()), 303)

  response.headers.set('Cache-Control', 'private, no-store')

  return response
}

function stageCookie(response: NextResponse, name: string, value: string) {
  response.cookies.set(name, value, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: '/api/newsletter/unsubscribe',
    sameSite: 'strict',
    secure: true,
  })
}

function clearCookies(response: NextResponse) {
  for (const name of [COOKIE_NAME, LOCALE_COOKIE]) {
    response.cookies.set(name, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/api/newsletter/unsubscribe',
      sameSite: 'strict',
      secure: true,
    })
  }
}

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams
  const token = parameters.get('token') ?? ''
  const targetLocale = locale(parameters.get('locale'))

  if (!TOKEN_PATTERN.test(token)) {
    return resultRedirect('/en?newsletter=unavailable')
  }

  const response = resultRedirect(
    `/${targetLocale}/confirm-email-action?action=newsletter-unsubscribe`,
  )

  stageCookie(response, COOKIE_NAME, token)
  stageCookie(response, LOCALE_COOKIE, targetLocale)

  return response
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  const oneClickToken = new URL(request.url).searchParams.get('token') ?? ''

  if (
    !request.headers.get('origin') &&
    contentType.startsWith('application/x-www-form-urlencoded')
  ) {
    let body: string

    try {
      body = await readBoundedText(request, 128)
    } catch (error) {
      return new NextResponse(null, {
        headers: {'Cache-Control': 'private, no-store'},
        status: error instanceof RequestBodyTooLargeError ? 413 : 400,
      })
    }

    if (body !== 'List-Unsubscribe=One-Click' || !TOKEN_PATTERN.test(oneClickToken)) {
      return new NextResponse(null, {
        headers: {'Cache-Control': 'private, no-store'},
        status: 400,
      })
    }

    await getConfiguredNewsletterService().unsubscribe(oneClickToken)

    return new NextResponse(null, {
      headers: {'Cache-Control': 'private, no-store'},
      status: 200,
    })
  }

  if (!isSameOriginMutation(request, getPublicAppOrigin())) {
    return new NextResponse(null, {
      headers: {'Cache-Control': 'private, no-store'},
      status: 403,
    })
  }

  const token = readCookie(request, COOKIE_NAME) ?? ''
  const targetLocale = locale(readCookie(request, LOCALE_COOKIE))

  try {
    if (!TOKEN_PATTERN.test(token)) throw new Error('INVALID_TOKEN')

    await getConfiguredNewsletterService().unsubscribe(token)
    const response = resultRedirect(`/${targetLocale}?newsletter=unsubscribed`)

    clearCookies(response)

    return response
  } catch {
    console.error('Newsletter unsubscribe failed')
    const response = resultRedirect(`/${targetLocale}?newsletter=unavailable`)

    clearCookies(response)

    return response
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
