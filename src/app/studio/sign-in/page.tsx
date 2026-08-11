import type {Metadata} from 'next'

import {StudioSignInForm} from '@/components/studio/studio-sign-in-form'

export const metadata: Metadata = {
  description: 'Private editor access for Bekten Studio.',
  robots: {follow: false, index: false},
  title: 'Sign in | Bekten Studio',
}

export default function StudioSignInPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#eee6d5] px-6 py-16 text-stone-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_10%,rgba(120,53,15,.18),transparent_34%),radial-gradient(circle_at_80%_90%,rgba(68,64,60,.15),transparent_35%)]"
      />
      <section
        aria-labelledby="studio-sign-in-title"
        className="relative w-full max-w-lg border border-stone-500/50 bg-[#f8f2e6]/90 p-8 shadow-[0_24px_80px_rgba(41,37,36,.14)] sm:p-12"
      >
        <p className="mb-5 text-xs font-semibold tracking-[0.24em] text-red-900 uppercase">
          Bekten Studio
        </p>
        <h1
          className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl"
          id="studio-sign-in-title"
        >
          Private editorial access
        </h1>
        <p className="mt-4 mb-8 max-w-md text-base leading-7 text-stone-700">
          Enter your approved email address. We will send a short-lived,
          one-time link—no password required.
        </p>
        <StudioSignInForm />
      </section>
    </main>
  )
}
