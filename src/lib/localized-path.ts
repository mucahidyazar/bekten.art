export const APP_LOCALES = ['en', 'tr', 'ru', 'ky'] as const

export type AppLocale = (typeof APP_LOCALES)[number]

function normalizePathname(pathname: string) {
  if (/^[a-z][a-z\d+.-]*:/iu.test(pathname) || pathname.includes('\\')) {
    throw new Error('Pathname must be a local path')
  }

  const [pathOnly] = pathname.split(/[?#]/u, 1)
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`
  const normalized = withLeadingSlash.replace(/\/+/g, '/').replace(/\/$/, '')

  return normalized === '' ? '/' : normalized
}

export function localizedAlternates(baseUrl: string, pathname: string) {
  const origin = new URL(baseUrl).origin
  const alternates = Object.fromEntries(
    APP_LOCALES.map(locale => [
      locale,
      `${origin}${localizedPath(locale, pathname)}`,
    ]),
  ) as Record<AppLocale, string>

  return {
    ...alternates,
    'x-default': alternates.en,
  }
}

export function localizedPath(locale: AppLocale, pathname: string) {
  if (!APP_LOCALES.includes(locale as AppLocale)) {
    throw new Error(`Unsupported locale: ${locale}`)
  }

  const normalizedPathname = normalizePathname(pathname)
  const segments = normalizedPathname.split('/')

  if (APP_LOCALES.includes(segments[1] as AppLocale)) {
    segments.splice(1, 1)
  }

  const publicPathname = segments.join('/') || '/'

  if (locale === 'en') return publicPathname

  return publicPathname === '/' ? `/${locale}` : `/${locale}${publicPathname}`
}
