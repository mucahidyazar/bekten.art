import './global.css'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import 'swiper/css/effect-fade'

import {Lora, Nanum_Pen_Script} from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'

import {Footer} from '@/components/Footer'
import {AppTools} from '@/components/molecules/AppTools'
import {Navbar} from '@/components/Navbar'
import {TrpcProvider} from '@/trpc/TrpcProvider'
import {cn, prepareMetadata} from '@/utils'

const lora = Lora({subsets: ['latin']})
const nanum = Nanum_Pen_Script({subsets: ['latin'], weight: ['400']})

export function generateMetadata() {
  return prepareMetadata()
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${lora.className} flex flex-col overflow-x-hidden h-full`}
      >
        <main className="w-full max-w-full lg:max-w-7xl mx-auto flex-grow flex flex-col lg:flex-row gap-5 h-full px-0 lg:px-4">
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
                Contemporary oil-focused painter
              </p>
            </aside>
            <Navbar />
            <AppTools
              className="lg:hidden absolute top-2 right-2 justify-end gap-1"
              withoutBg
            />
          </section>
          <section className="h-full relative px-4 lg:px-0 lg:min-w-[calc(100%-15rem)] lg:w-[calc(100%-15rem)] lg:ml-auto lg:pt-20 lg:pb-8">
            <div className="sticky top-0 left-0 w-full h-10 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none -mt-10" />
            <TrpcProvider>{children}</TrpcProvider>
          </section>
        </main>
        <Footer className="flex flex-col items-center py-8 gap-4 lg:hidden" />
      </body>
    </html>
  )
}
