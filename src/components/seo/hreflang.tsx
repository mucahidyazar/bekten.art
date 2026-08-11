'use client'

import {usePathname} from 'next/navigation'

import {
  APP_LOCALES,
  type AppLocale,
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

interface HrefLangProps {
  locales?: readonly string[]
  defaultLocale?: AppLocale
}

function getLocalizedRoute(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const routeLocale = segments[0]
  const isSupportedLocale = APP_LOCALES.includes(routeLocale as AppLocale)
  const isLegacyKyrgyzLocale = routeLocale === 'kg'
  const locale = isSupportedLocale
    ? (routeLocale as AppLocale)
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
  locales: readonly AppLocale[] = APP_LOCALES,
  defaultLocale: AppLocale = 'en',
) {
  const {locale, publicPath} = getLocalizedRoute(pathname)
  const urls = localizedAlternates(baseUrl, publicPath)
  const publicSegments = publicPath.split('/').filter(Boolean)
  const hasUnverifiedLocalizedSlug =
    publicSegments.length > 1 &&
    NON_PARALLEL_DETAIL_ROOTS.has(publicSegments[0] ?? '')

  return {
    canonical: urls[locale],
    alternates: hasUnverifiedLocalizedSlug
      ? []
      : [
          ...locales.map(currentLocale => ({
            hrefLang: HREFLANG_BY_LOCALE[currentLocale],
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
  const supportedLocales = locales.filter(locale =>
    APP_LOCALES.includes(locale as AppLocale),
  ) as AppLocale[]
  const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art'
  const links = buildLocalizedLinks(
    pathname,
    domain,
    supportedLocales,
    defaultLocale,
  )
  const {publicPath} = getLocalizedRoute(pathname)
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
