'use client'

import {useTranslations} from 'next-intl'

import {cn} from '@/utils'

import {NavbarItem} from './navbar-item'

import type {UiUser} from '@/types/ui-user'

type NavbarProps = {
  className?: string
  user?: UiUser | null
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
    ...(user?.role === 'ADMIN'
      ? [{label: 'Admin', path: '/admin'}]
      : []),
  ]

  return (
    <nav
      className={cn('scrollbar-hide flex flex-col overflow-scroll', className)}
    >
      <ul className="text-muted-foreground flex justify-center gap-4 text-sm">
        {NAV_ITEMS.map(item => (
          <NavbarItem key={item.label} {...item} />
        ))}
      </ul>
    </nav>
  )
}
