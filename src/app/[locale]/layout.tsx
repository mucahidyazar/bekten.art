import './global.css'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import 'swiper/css/effect-fade'

import {Lora} from 'next/font/google'
import {notFound} from 'next/navigation'
import {getServerSession} from 'next-auth'
import {NextIntlClientProvider} from 'next-intl'

import {Footer} from '@/components/Footer'
import {AppTools} from '@/components/molecules/AppTools'
import {Sidebar} from '@/components/organisms/Sidebar'
import {ThemeProvider} from '@/components/providers/ThemeProvider'
import {prepareMetadata} from '@/utils/prepareMetadata'

import {SessionProvider} from './SessionProvider'

const lora = Lora({subsets: ['latin']})

export function generateMetadata() {
  return prepareMetadata()
}

async function getMessages(locale: string) {
  try {
    return (await import(`../../../public/locales/${locale}/common.json`))
      .default
  } catch (error) {
    notFound()
  }
}

type LayoutProps = {
  children: React.ReactNode
  params: {
    locale: string
  }
}
export default async function RootLayout({
  children,
  params: {locale},
}: LayoutProps) {
  const session = await getServerSession()
  const messages = await getMessages(locale)

  return (
    <html lang={locale}>
      <head />
      <body
        className={`${lora.className} flex flex-col overflow-x-hidden bg-background`}
      >
        <SessionProvider session={session}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              themes={['dark', 'light', 'navy']}
            >
              <div className="mx-auto flex min-h-[100vh] w-full max-w-full flex-grow flex-col gap-5 px-0 lg:max-w-7xl lg:px-4">
                <Sidebar />
                <div className="relative flex-grow px-4 lg:ml-auto lg:w-[calc(100%-15rem)] lg:min-w-[calc(100%-15rem)] lg:px-0 lg:pb-8 lg:pt-10">
                  <div className="pointer-events-none sticky left-0 top-0 z-10 -mt-10 h-10 w-full bg-gradient-to-b from-background to-transparent lg:mb-10" />
                  {children}
                </div>
                <Footer className="flex flex-col items-center gap-4 py-8 lg:hidden" />
                <AppTools />
              </div>
            </ThemeProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
