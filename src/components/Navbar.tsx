'use client'

import {useTranslations} from 'next-intl'

import {cn} from '@/utils'

import {NavbarItem} from './navbar-item'

type NavbarProps = {
  className?: string
  user?: any
}
export function Navbar({className, user}: NavbarProps) {
  const t = useTranslations()

  const NAV_ITEMS = [
    {
      label: t('navigation.home'),
      path: '/',
    },
    {
      label: t('navigation.news'),
      path: '/news',
    },
    {
      label: t('navigation.about'),
      path: '/about',
    },
    {
      label: t('navigation.gallery'),
      path: '/gallery',
    },
    {
      label: t('navigation.contact'),
      path: '/contact',
    },
    {
      label: t('navigation.store'),
      path: '/store',
    },
    ...(user?.profile?.role?.toLowerCase() === 'admin'
      ? [{label: 'Admin', path: '/admin'}]
      : []),
  ]

  return (
    <nav className={cn('flex flex-col', className)}>
      <ul className="text-muted-foreground flex flex-wrap justify-center gap-4 text-sm">
        {NAV_ITEMS.map(item => (
          <NavbarItem key={item.label} {...item} />
        ))}
      </ul>
    </nav>
  )
}
