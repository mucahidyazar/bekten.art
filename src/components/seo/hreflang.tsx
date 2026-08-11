'use client'

import {usePathname} from 'next/navigation'

import {
  APP_LOCALES,
  type AppLocale,
  isSafeLocaleCode,
  localizedAlternates,
} from '@/lib/localized-path'

const HREFLANG_BY_LOCALE: Record<AppLocale, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  ru: 'ru-RU',
  ky: 'ky-KG',
}

const NON_PARALLEL_DETAIL_ROOTS = new Set([
  'collections',
  'exhibitions',
  'journal',
  'press',
  'works',
])
const ROUTES_WITH_METADATA_CANONICAL = new Set([
  'archive',
  'about',
  'available-works',
  'collections',
  'collectors',
  'commission-a-work',
  'contact',
  'exhibitions',
  'journal',
  'press',
  'private-viewings',
  'studio',
  'works',
])
const ROUTES_WITH_COMPLETE_DYNAMIC_TRANSLATIONS = new Set([
  'privacy-policy',
  'terms-of-service',
])

interface HrefLangProps {
  locales?: readonly string[]
  defaultLocale?: string
}

function getLocalizedRoute(
  pathname: string,
  locales: readonly string[] = APP_LOCALES,
) {
  const segments = pathname.split('/').filter(Boolean)
  const routeLocale = segments[0]
  const isSupportedLocale = Boolean(
    routeLocale &&
      isSafeLocaleCode(routeLocale) &&
      locales.includes(routeLocale),
  )
  const isLegacyKyrgyzLocale = routeLocale === 'kg'
  const locale = isSupportedLocale
    ? routeLocale!
    : isLegacyKyrgyzLocale
      ? 'ky'
      : 'en'
  const publicSegments =
    isSupportedLocale || isLegacyKyrgyzLocale ? segments.slice(1) : segments

  return {
    locale,
    publicPath: publicSegments.length ? `/${publicSegments.join('/')}` : '/',
  }
}

function buildLocalizedLinks(
  pathname: string,
  baseUrl: string,
  locales: readonly string[] = APP_LOCALES,
  defaultLocale = 'en',
) {
  const {locale, publicPath} = getLocalizedRoute(pathname, locales)
  const publicSegments = publicPath.split('/').filter(Boolean)
  const routeRoot = publicSegments[0]
  const alternateLocales =
    routeRoot && ROUTES_WITH_COMPLETE_DYNAMIC_TRANSLATIONS.has(routeRoot)
      ? locales
      : locales.filter(currentLocale =>
          APP_LOCALES.some(builtInLocale => builtInLocale === currentLocale),
        )
  const urls = localizedAlternates(baseUrl, publicPath, alternateLocales)
  const hasUnverifiedLocalizedSlug =
    publicSegments.length > 1 &&
    NON_PARALLEL_DETAIL_ROOTS.has(publicSegments[0] ?? '')

  return {
    canonical: urls[locale] ?? urls[defaultLocale] ?? baseUrl,
    alternates: hasUnverifiedLocalizedSlug
      ? []
      : [
          ...alternateLocales.map(currentLocale => ({
            hrefLang:
              HREFLANG_BY_LOCALE[currentLocale as AppLocale] ?? currentLocale,
            href: urls[currentLocale],
          })),
          {hrefLang: 'x-default', href: urls[defaultLocale]},
        ],
  }
}

export function HrefLang({
  locales = APP_LOCALES,
  defaultLocale = 'en',
}: HrefLangProps) {
  const pathname = usePathname()
  const supportedLocales = locales.filter(isSafeLocaleCode)
  const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art'
  const links = buildLocalizedLinks(
    pathname,
    domain,
    supportedLocales,
    defaultLocale,
  )
  const {publicPath} = getLocalizedRoute(pathname, supportedLocales)
  const routeRoot = publicPath.split('/').filter(Boolean)[0]
  const hasMetadataCanonical =
    routeRoot !== undefined && ROUTES_WITH_METADATA_CANONICAL.has(routeRoot)

  return (
    <>
      {hasMetadataCanonical ? null : (
        <link rel="canonical" href={links.canonical} />
      )}
      {links.alternates.map(alternate => (
        <link
          key={alternate.hrefLang}
          rel="alternate"
          hrefLang={alternate.hrefLang}
          href={alternate.href}
        />
      ))}
    </>
  )
}

export {buildLocalizedLinks}
