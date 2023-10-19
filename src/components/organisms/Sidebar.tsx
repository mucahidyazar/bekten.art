import {Nanum_Pen_Script} from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'

import {Navbar} from '@/components/Navbar'
import {cn} from '@/utils'

import {AppTools} from '../molecules/AppTools'

const nanum = Nanum_Pen_Script({subsets: ['latin'], weight: ['400']})

export function Sidebar() {
  return (
    <section className="flex flex-col mx-auto w-full lg:h-full lg:min-h-[100vh] lg:max-h-[100vh] lg:w-[15rem] lg:min-w-[15rem] lg:pt-20 pb-4 lg:pb-8 pt-8 lg:fixed lg:top-0 lg:left-0 px-4">
      <aside className="flex flex-col items-center lg:items-start">
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
            'text-gray-500 text-xs mb-4 lg:mb-8 text-center lg:text-left uppercase',
          )}
        >
          CONTEMPORARY OIL-FOCUSED PAINTER
        </p>
      </aside>
      <Navbar />
      <AppTools
        className="lg:hidden absolute top-2 right-2 justify-end gap-1"
        withoutBg
      />
    </section>
  )
}
