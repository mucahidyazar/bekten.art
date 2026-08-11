export const APP_LOCALES = [
  'en',
  'tr',
  'ru',
  'ky',
] as const satisfies readonly BuiltInAppLocale[]
export type AppLocale = string

export type BuiltInAppLocale = 'en' | 'ky' | 'ru' | 'tr'

const LOCALE_CODE_PATTERN =
  /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|\d{3}))?$/u

export function isSafeLocaleCode(locale: string) {
  return locale !== 'kg' && LOCALE_CODE_PATTERN.test(locale)
}

function normalizePathname(pathname: string) {
  if (/^[a-z][a-z\d+.-]*:/iu.test(pathname) || pathname.includes('\\')) {
    throw new Error('Pathname must be a local path')
  }

  const [pathOnly] = pathname.split(/[?#]/u, 1)
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`
  const normalized = withLeadingSlash.replace(/\/+/g, '/').replace(/\/$/, '')

  return normalized === '' ? '/' : normalized
}

export function localizedAlternates(
  baseUrl: string,
  pathname: string,
  locales: readonly string[] = APP_LOCALES,
): Readonly<Record<string, string>> {
  const origin = new URL(baseUrl).origin
  const validLocales = [...new Set(locales)]

  if (
    !validLocales.includes('en') ||
    validLocales.some(locale => !isSafeLocaleCode(locale))
  ) {
    throw new Error('Unsupported locale registry')
  }

  const alternates = Object.fromEntries(
    validLocales.map(locale => [
      locale,
      `${origin}${localizedPath(locale, pathname)}`,
    ]),
  ) as Record<string, string>

  const english = alternates.en

  if (!english) throw new Error('English locale is required')

  return Object.freeze({
    ...alternates,
    'x-default': english,
  })
}

export function localizedPath(locale: string, pathname: string) {
  if (!isSafeLocaleCode(locale)) {
    throw new Error(`Unsupported locale: ${locale}`)
  }

  const normalizedPathname = normalizePathname(pathname)
  const segments = normalizedPathname.split('/')

  if (segments[1] && (segments[1] === 'kg' || isSafeLocaleCode(segments[1]))) {
    segments.splice(1, 1)
  }

  const publicPathname = segments.join('/') || '/'

  if (locale === 'en') return publicPathname

  return publicPathname === '/' ? `/${locale}` : `/${locale}${publicPathname}`
}
