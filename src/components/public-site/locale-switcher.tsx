'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {localizedPath} from '@/lib/localized-path'

import {PUBLIC_LOCALES, type PublicLocale} from './public-copy'

const localeNames: Readonly<Record<PublicLocale, string>> = Object.freeze({
  en: 'English',
  ky: 'Кыргызча',
  ru: 'Русский',
  tr: 'Türkçe',
})

const navigationLabels: Readonly<Record<PublicLocale, string>> = Object.freeze({
  en: 'Languages',
  ky: 'Тилдер',
  ru: 'Языки',
  tr: 'Diller',
})

export function LocaleSwitcher({locale}: Readonly<{locale: PublicLocale}>) {
  const pathname = usePathname() || localizedPath(locale, '/')

  return (
    <nav
      aria-label={navigationLabels[locale]}
      className="heritage-locale-switcher"
    >
      {PUBLIC_LOCALES.map(candidate => (
        <Link
          aria-current={candidate === locale ? 'page' : undefined}
          href={buildLocaleSiblingPath(pathname, candidate)}
          hrefLang={candidate}
          key={candidate}
          lang={candidate}
        >
          <span className="sr-only">{localeNames[candidate]}</span>
          <span aria-hidden="true">{candidate}</span>
        </Link>
      ))}
    </nav>
  )
}

export function buildLocaleSiblingPath(pathname: string, locale: PublicLocale) {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const hasLocale =
    first === 'kg' || PUBLIC_LOCALES.some(candidate => candidate === first)
  const remaining = hasLocale ? segments.slice(1) : segments
  const localizedDetailRoots = new Set([
    'collections',
    'exhibitions',
    'journal',
    'press',
    'works',
  ])
  const safeRemaining =
    remaining.length > 1 && localizedDetailRoots.has(remaining[0] ?? '')
      ? remaining.slice(0, 1)
      : remaining

  const publicPath = safeRemaining.length ? `/${safeRemaining.join('/')}` : '/'

  return localizedPath(locale, publicPath)
}
