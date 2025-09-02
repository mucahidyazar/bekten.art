'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {cn} from '@/utils/cn'

interface INavbarItemProps {
  label: string
  path: string
}
export function NavbarItem(item: INavbarItemProps) {
  const pathname = usePathname()

  const isActive = () => {
    // Remove locale prefix from pathname for comparison (e.g., /tr/about -> /about)
    const segments = pathname.split('/').filter(Boolean)
    const cleanPathname =
      segments.length > 0 &&
      segments[0].length === 2 &&
      segments[0].match(/^[a-z]{2}$/)
        ? '/' + segments.slice(1).join('/')
        : pathname
    const normalizedPath = cleanPathname || '/'

    // Exact match for home page
    if (item.path === '/') {
      return normalizedPath === '/'
    }

    // For other pages, check exact match or sub-path match
    return (
      normalizedPath === item.path || normalizedPath.startsWith(item.path + '/')
    )
  }

  return (
    <li
      key={item.label}
      className={cn(
        'group hover:text-primary w-fit transition-colors duration-200',
        isActive() && 'text-primary font-medium',
      )}
    >
      <Link href={item.path}>{item.label}</Link>
      <div
        className={cn(
          'bg-primary h-[2px] w-0 transition-all duration-300 ease-in-out group-hover:w-full',
          isActive() && 'bg-primary h-[2px] w-full',
        )}
      />
    </li>
  )
}
