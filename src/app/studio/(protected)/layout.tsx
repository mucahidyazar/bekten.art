import Link from 'next/link'
import {redirect} from 'next/navigation'

import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {isStudioOwnerRole} from '@/server/studio-auth/roles'

import type {ReactNode} from 'react'

const editorialNavigation = [
  {href: '/studio', label: 'Overview'},
  {href: '/studio/artworks', label: 'Artworks'},
  {href: '/studio/collections', label: 'Collections'},
  {href: '/studio/exhibitions', label: 'Exhibitions'},
  {href: '/studio/journal', label: 'Journal'},
  {href: '/studio/pages', label: 'Pages'},
  {href: '/studio/press', label: 'Press'},
  {href: '/studio/inquiries', label: 'Inquiries'},
  {href: '/studio/media', label: 'Media'},
] as const

export default async function StudioProtectedLayout({
  children,
}: Readonly<{children: ReactNode}>) {
  let user: Awaited<ReturnType<typeof requireStudioEditor>>

  try {
    user = await requireStudioEditor()
  } catch (error) {
    if (
      error instanceof Error &&
      'statusCode' in error &&
      (error.statusCode === 401 || error.statusCode === 403)
    ) {
      redirect('/studio/sign-in')
    }

    throw error
  }

  return (
    <div className="min-h-dvh bg-[#eee6d5] text-stone-950">
      <a
        className="sr-only z-50 bg-stone-950 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        href="#studio-content"
      >
        Skip to Studio content
      </a>
      <header className="border-b border-stone-400/60 bg-[#f8f2e6] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link className="font-serif text-2xl tracking-tight" href="/studio">
            Bekten Studio
          </Link>
          <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
            Private editorial workspace
          </p>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 md:grid-cols-[13rem_1fr]">
        <nav
          aria-label="Studio"
          className="overflow-x-auto md:sticky md:top-8 md:self-start"
        >
          <ul className="flex min-w-max gap-1 md:grid md:min-w-0">
            {editorialNavigation.map(item => (
              <li key={item.href}>
                <Link
                  className="block border-l-2 border-transparent px-4 py-3 font-medium transition hover:border-red-900 hover:bg-white/40 focus-visible:border-red-900 focus-visible:bg-white/40 focus-visible:outline-none"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {isStudioOwnerRole(user.role) ? (
              <li className="mt-0 border-stone-400/60 md:mt-4 md:border-t md:pt-4">
                <Link
                  className="block border-l-2 border-transparent px-4 py-3 font-medium transition hover:border-red-900 hover:bg-white/40 focus-visible:border-red-900 focus-visible:bg-white/40 focus-visible:outline-none"
                  href="/studio/operations"
                >
                  Operations
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
        <main id="studio-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}
