import {cookies} from 'next/headers'
import {useTranslations} from 'next-intl'

import {env} from '@/configs'
import {cn} from '@/utils'

import {Footer} from './Footer'
import {NavbarItem} from './NavbarItem'

type NavbarProps = {
  className?: string
}
export function Navbar({className}: NavbarProps) {
  const cookieStore = cookies()
  const dashboardCookie = cookieStore.get('dashboard')?.value || ''
  const dashboardEnv = String(env.DASHBOARD)
  const isAdmin = dashboardCookie === dashboardEnv

  const t = useTranslations()

  const NAV_ITEMS = [
    {
      label: t('home'),
      path: '/',
    },
    {
      label: t('news'),
      path: '/news',
    },
    {
      label: t('about'),
      path: '/about',
    },
    {
      label: t('gallery'),
      path: '/gallery',
    },
    {
      label: t('contact'),
      path: '/contact',
    },
    ...(isAdmin && !1 ? [{label: 'Dashboard', path: '/dashboard'}] : []),
  ]

  return (
    <nav className={cn('flex flex-col h-full', className)}>
      <ul className="flex text-sm lg:text-base lg:flex-grow lg:flex-col lg:justify-start justify-center gap-4 text-gray-500 lg:mb-8">
        {NAV_ITEMS.map(item => (
          <NavbarItem key={item.label} {...item} />
        ))}
      </ul>
      <Footer />
    </nav>
  )
}
