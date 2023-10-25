/* eslint-disable @next/next/no-before-interactive-script-outside-document */
'use client'

import Image from 'next/image'
import Script from 'next/script'
import {useSession, signIn, signOut} from 'next-auth/react'

import {OneTapComponent} from '@/components/molecules/OneTapComponent'
import {Button} from '@/components/ui/button'

export default function Component() {
  const {data: session} = useSession()

  if (session) {
    return (
      <section className="mt-[30%] flex w-full flex-col gap-2 sm:w-80">
        <aside className="flex flex-col items-center gap-2">
          <Image
            src={session.user?.image || ''}
            width={100}
            height={100}
            alt="user avatar"
          />
          <p>{session.user?.name}</p>
        </aside>
        <Button onClick={() => signOut()}>Sign out</Button>
      </section>
    )
  }

  return (
    <div>
      <OneTapComponent />
      <section className="mt-[30%] flex w-full flex-col gap-2 sm:w-80">
        <Button onClick={() => signIn('github')}>Sign in by Github</Button>
        <Button onClick={() => signIn('google')}>Sign in by Google</Button>
      </section>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />
    </div>
  )
}
