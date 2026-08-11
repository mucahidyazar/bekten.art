import Link from 'next/link'
import {redirect} from 'next/navigation'

import {requireStudioEditor} from '@/server/studio-auth/configured-access'

export default async function StudioProtectedLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  try {
    await requireStudioEditor()
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
        <nav aria-label="Studio" className="md:sticky md:top-8 md:self-start">
          <Link
            aria-current="page"
            className="block border-l-2 border-red-900 bg-white/40 px-4 py-3 font-medium"
            href="/studio"
          >
            Overview
          </Link>
        </nav>
        <main id="studio-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}
