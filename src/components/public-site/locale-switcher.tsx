'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {isSafeLocaleCode, localizedPath} from '@/lib/localized-path'

import {
  DEFAULT_PUBLIC_LOCALE_OPTIONS,
  isPublicLocale,
} from './public-copy'
import {NAV_LATERAL_TRANSITION} from './public-view-transition'

const navigationLabels = Object.freeze({
  en: 'Languages',
  ky: 'Тилдер',
  ru: 'Языки',
  tr: 'Diller',
})

type LocaleSwitcherProps = Readonly<{
  locale: string
  locales?: readonly Readonly<{code: string; nativeName: string}>[]
}>

export function LocaleSwitcher({
  locale,
  locales = DEFAULT_PUBLIC_LOCALE_OPTIONS,
}: LocaleSwitcherProps) {
  const pathname = usePathname() || localizedPath(locale, '/')
  const navigationLabel = navigationLabels[isPublicLocale(locale) ? locale : 'en']

  return (
    <nav
      aria-label={navigationLabel}
      className="heritage-locale-switcher"
    >
      {locales.map(candidate => (
        <Link
          aria-current={candidate.code === locale ? 'page' : undefined}
          href={buildLocaleSiblingPath(pathname, candidate.code)}
          hrefLang={candidate.code}
          key={candidate.code}
          lang={candidate.code}
          transitionTypes={[...NAV_LATERAL_TRANSITION]}
        >
          <span className="sr-only">{candidate.nativeName}</span>
          <span aria-hidden="true">{candidate.code}</span>
        </Link>
      ))}
    </nav>
  )
}

export function buildLocaleSiblingPath(pathname: string, locale: string) {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const hasLocale = first === 'kg' || (first ? isSafeLocaleCode(first) : false)
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
