'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {cn} from '@/utils'

interface INavbarItemProps {
  label: string
  path: string
}
export function NavbarItem(item: INavbarItemProps) {
  const pathname = usePathname()

  const isActive = () => {
    if (item.path === '/' && pathname === '/') return true
    if (item.path === '/' && pathname !== '/') return false

    return pathname.includes(item.path)
  }

  return (
    <li
      key={item.label}
      className={cn(
        'group w-fit hover:text-primary-700',
        isActive() && 'text-primary-900',
      )}
    >
      <Link href={item.path}>{item.label}</Link>
      <p
        className={cn(
          'w-0 h-[1px] bg-gray-300 group-hover:w-full group-hover:bg-primary-700 group-hover:h-[1px] transition-all duration-300 ease-in-out',
          isActive() && 'w-full bg-primary-900 h-[1px]',
        )}
      />
    </li>
  )
}
