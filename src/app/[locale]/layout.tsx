import './global.css'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import 'swiper/css/effect-fade'

import {Lora} from 'next/font/google'
import {notFound} from 'next/navigation'
import {NextIntlClientProvider} from 'next-intl'

import {Footer} from '@/components/Footer'
import {AppTools} from '@/components/molecules/AppTools'
import {Sidebar} from '@/components/organisms/Sidebar'
import {prepareMetadata} from '@/utils'

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
  const messages = await getMessages(locale)

  return (
    <html lang={locale}>
      <head />
      <body
        className={`${lora.className} flex flex-col overflow-x-hidden h-full`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <main className="w-full max-w-full lg:max-w-7xl mx-auto flex-grow flex flex-col lg:flex-row gap-5 h-full px-0 lg:px-4">
            <Sidebar />
            <section className="h-full relative px-4 lg:px-0 lg:min-w-[calc(100%-15rem)] lg:w-[calc(100%-15rem)] lg:ml-auto lg:pt-20 lg:pb-8">
              <div className="sticky top-0 left-0 w-full h-10 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none -mt-10" />
              {children}
            </section>
          </main>
          <Footer className="flex flex-col items-center py-8 gap-4 lg:hidden" />

          <AppTools />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
