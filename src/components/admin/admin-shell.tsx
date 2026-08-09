'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {
  Activity,
  ChevronDown,
  Database,
  FileText,
  Image,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react'
import {signOut} from 'next-auth/react'
import {useTransition} from 'react'

import {cn} from '@/utils/cn'

const items = [
  {href: 'overview', icon: LayoutDashboard, label: 'Overview'},
  {href: 'users', icon: Users, label: 'Users'},
  {href: 'content', icon: FileText, label: 'Content'},
  {href: 'media', icon: Image, label: 'Media'},
  {href: 'contact', icon: MessageSquare, label: 'Contact'},
  {href: 'email', icon: Mail, label: 'Email'},
  {href: 'system', icon: Database, label: 'System'},
  {href: 'audit', icon: Activity, label: 'Audit log'},
] as const

type AdminUser = Readonly<{email: string | null; name: string | null}>

function Navigation({
  locale,
  pathname,
}: Readonly<{locale: string; pathname: string}>) {
  return (
    <nav aria-label="Admin sections" className="space-y-1">
      {items.map(item => {
        const href = `/${locale}/admin/${item.href}`
        const active = pathname === href || pathname.startsWith(`${href}/`)
        const Icon = item.icon

        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600',
              active
                ? 'border-stone-700 bg-stone-800 text-white shadow-sm'
                : 'border-transparent text-stone-300 hover:border-stone-700 hover:bg-stone-900 hover:text-white',
            )}
            href={href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0 text-red-400" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminShell({
  children,
  locale,
  user,
}: Readonly<{
  children: React.ReactNode
  locale: string
  user: AdminUser
}>) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const displayName = user.name?.trim() || user.email?.trim() || 'Administrator'

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <div className="mx-auto grid min-h-screen w-full max-w-[1680px] xl:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r border-stone-800 bg-stone-950 px-4 py-6 text-white xl:flex xl:flex-col">
          <div className="flex items-center gap-3 border-b border-stone-800 px-2 pb-6">
            <span className="grid size-10 place-items-center rounded-xl border border-red-800 bg-red-950 text-red-300">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-serif text-lg font-semibold">Bekten Studio</p>
              <p className="text-xs tracking-[0.16em] text-stone-400 uppercase">
                Operations
              </p>
            </div>
          </div>

          <div className="mt-6 flex-1">
            <Navigation locale={locale} pathname={pathname} />
          </div>

          <div className="mt-6 border-t border-stone-800 pt-5">
            <p className="truncate px-2 text-sm font-medium">{displayName}</p>
            {user.email ? (
              <p className="mt-1 truncate px-2 text-xs text-stone-400">
                {user.email}
              </p>
            ) : null}
            <button
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-700 px-3 py-2 text-sm font-medium text-stone-200 transition hover:border-red-700 hover:bg-red-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-60"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await signOut({callbackUrl: `/${locale}`})
                })
              }}
              type="button"
            >
              <LogOut aria-hidden="true" className="size-4" />
              {isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur xl:hidden dark:border-stone-800 dark:bg-stone-950/95">
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-stone-700 dark:bg-stone-900">
                <span className="flex items-center gap-2">
                  <Menu
                    aria-hidden="true"
                    className="size-4 text-red-700 dark:text-red-400"
                  />
                  Admin navigation
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition group-open:rotate-180"
                />
              </summary>
              <div className="mt-2 rounded-2xl border border-stone-800 bg-stone-950 p-3 text-white shadow-xl">
                <Navigation locale={locale} pathname={pathname} />
              </div>
            </details>
          </header>

          <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
