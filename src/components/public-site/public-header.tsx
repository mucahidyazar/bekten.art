'use client'

import Image from 'next/image'
import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {localizedPath} from '@/lib/localized-path'

import {LocaleSwitcher} from './locale-switcher'
import {publicShellCopy, type PublicLocale} from './public-copy'

type PublicHeaderProps = Readonly<{locale: PublicLocale}>

export function PublicHeader({locale}: PublicHeaderProps) {
  const copy = publicShellCopy[locale]
  const pathname = usePathname()
  const navigation = [
    {href: '/', label: copy.home},
    {href: 'collections', label: copy.collections},
    {href: 'about', label: copy.studio},
    {href: 'works', label: copy.works},
    {href: 'collectors', label: copy.collectors},
    {href: 'contact', label: copy.contact},
  ] as const
  const secondaryNavigation = [
    {href: 'exhibitions', label: copy.exhibitions},
    {href: 'journal', label: copy.journal},
    {href: 'press', label: copy.press},
  ] as const

  function isCurrentRoute(href: string) {
    const target = localizedPath(locale, href)

    if (target === '/') return pathname === target

    return pathname === target || pathname.startsWith(`${target}/`)
  }

  return (
    <header className="heritage-header" data-testid="heritage-header">
      <div className="heritage-shell heritage-header__inner">
        <Link className="heritage-wordmark" href={localizedPath(locale, '/')}>
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
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="heritage-header__actions">
          <LocaleSwitcher locale={locale} />
        </div>

        <details className="heritage-mobile-menu">
          <summary>{copy.menu}</summary>
          <div className="heritage-mobile-menu__panel">
            {navigation.map(item => (
              <Link
                aria-current={isCurrentRoute(item.href) ? 'page' : undefined}
                href={localizedPath(locale, item.href)}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
            {secondaryNavigation.map(item => (
              <Link
                aria-current={isCurrentRoute(item.href) ? 'page' : undefined}
                href={localizedPath(locale, item.href)}
                key={item.href}
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
