import {Nanum_Brush_Script} from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'

import {Navbar} from '@/components/Navbar'
import {cn} from '@/utils'
import {getUser} from '@/utils/supabase/server'

import {AppTools} from '../molecules/AppTools'

const nanum = Nanum_Brush_Script({
  subsets: ['latin'],
  weight: ['400'],
})

export async function Header() {
  const userProfile = await getUser()
  const user = userProfile

  return (
    <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b pt-4 backdrop-blur">
      <div className="relative container flex w-full flex-col">
        <AppTools user={user} />
        <aside className="flex flex-col items-center">
          <Link href="/">
            <Image
              src="/svg/full-logo.svg"
              alt="logo"
              width={120}
              height={40}
              className="mb-4 cursor-pointer"
            />
          </Link>
          <p
            className={cn(
              nanum.className,
              'text-muted-foreground mb-4 text-center text-xs uppercase',
            )}
          >
            CONTEMPORARY OIL-FOCUSED PAINTER
          </p>
        </aside>
        <Navbar user={userProfile} />
      </div>
    </header>
  )
}
