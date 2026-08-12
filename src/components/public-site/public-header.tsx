'use client'

import Image from 'next/image'
import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {localizedPath} from '@/lib/localized-path'

import {LocaleSwitcher} from './locale-switcher'
import {
  DEFAULT_PUBLIC_LOCALE_OPTIONS,
  publicShellCopyFor,
} from './public-copy'
import {
  NAV_BACK_TRANSITION,
  NAV_LATERAL_TRANSITION,
} from './public-view-transition'

type PublicHeaderProps = Readonly<{
  locale: string
  locales?: readonly Readonly<{code: string; nativeName: string}>[]
}>

export function PublicHeader({
  locale,
  locales = DEFAULT_PUBLIC_LOCALE_OPTIONS,
}: PublicHeaderProps) {
  const copy = publicShellCopyFor(locale)
  const pathname = usePathname()
  const navigation = [
    {href: '/', label: copy.home},
    {href: 'collections', label: copy.collections},
    {href: 'about', label: copy.studio},
    {href: 'works', label: copy.works},
    {href: 'studio', label: copy.studioPage},
    {href: 'contact', label: copy.contact},
  ] as const
  const secondaryNavigation = [
    {href: 'exhibitions', label: copy.exhibitions},
    {href: 'journal', label: copy.journal},
    {href: 'press', label: copy.press},
  ] as const

  function isCurrentRoute(href: string) {
    const target = localizedPath(locale, href)

    if (href === '/') return pathname === target

    return pathname === target || pathname.startsWith(`${target}/`)
  }

  return (
    <header
      className="heritage-header"
      data-testid="heritage-header"
      style={{viewTransitionName: 'persistent-header'}}
    >
      <div className="heritage-shell heritage-header__inner">
        <Link
          className="heritage-wordmark"
          href={localizedPath(locale, '/')}
          transitionTypes={[...NAV_BACK_TRANSITION]}
        >
          <Image
            alt=""
            aria-hidden="true"
            height={48}
            priority
            src="/svg/full-logo.svg"
            unoptimized
            width={180}
          />
          <span className="sr-only">Bekten — {copy.home}</span>
        </Link>

        <nav aria-label={copy.navigationLabel} className="heritage-nav">
          {navigation.map(item => (
            <Link
              aria-current={isCurrentRoute(item.href) ? 'page' : undefined}
              href={localizedPath(locale, item.href)}
              key={item.href}
              transitionTypes={[
                ...(item.href === '/'
                  ? NAV_BACK_TRANSITION
                  : NAV_LATERAL_TRANSITION),
              ]}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="heritage-header__actions">
          <LocaleSwitcher locale={locale} locales={locales} />
        </div>

        <details className="heritage-mobile-menu">
          <summary>{copy.menu}</summary>
          <div className="heritage-mobile-menu__panel">
            {navigation.map(item => (
              <Link
                aria-current={isCurrentRoute(item.href) ? 'page' : undefined}
                href={localizedPath(locale, item.href)}
                key={item.href}
                transitionTypes={[
                  ...(item.href === '/'
                    ? NAV_BACK_TRANSITION
                    : NAV_LATERAL_TRANSITION),
                ]}
              >
                {item.label}
              </Link>
            ))}
            {secondaryNavigation.map(item => (
              <Link
                aria-current={isCurrentRoute(item.href) ? 'page' : undefined}
                href={localizedPath(locale, item.href)}
                key={item.href}
                transitionTypes={[...NAV_LATERAL_TRANSITION]}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  )
}
