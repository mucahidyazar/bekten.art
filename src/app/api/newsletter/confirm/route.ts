import {NextResponse} from 'next/server'

import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {getConfiguredNewsletterService} from '@/server/email/configured-newsletter-service'
import {getPublicAppOrigin} from '@/server/email/public-api'

const COOKIE_NAME = 'bekten_newsletter_confirmation'
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
  const response = NextResponse.redirect(
    new URL(path, getPublicAppOrigin()),
    303,
  )

  response.headers.set('Cache-Control', 'private, no-store')

  return response
}

function stageCookie(
  response: NextResponse,
  name: string,
  value: string,
  path: string,
) {
  response.cookies.set(name, value, {
    httpOnly: true,
    maxAge: 10 * 60,
    path,
    sameSite: 'strict',
    secure: true,
  })
}

function clearCookies(response: NextResponse) {
  for (const name of [COOKIE_NAME, LOCALE_COOKIE]) {
    response.cookies.set(name, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/api/newsletter/confirm',
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
    `/${targetLocale}/newsletter-preferences?action=newsletter-confirm`,
  )

  stageCookie(response, COOKIE_NAME, token, '/api/newsletter/confirm')
  stageCookie(response, LOCALE_COOKIE, targetLocale, '/api/newsletter/confirm')

  return response
}

export async function POST(request: Request) {
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

    await getConfiguredNewsletterService().confirm(token)
    const response = resultRedirect(`/${targetLocale}?newsletter=confirmed`)

    clearCookies(response)

    return response
  } catch {
    console.error('Newsletter confirmation failed')
    const response = resultRedirect(`/${targetLocale}?newsletter=unavailable`)

    clearCookies(response)

    return response
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
