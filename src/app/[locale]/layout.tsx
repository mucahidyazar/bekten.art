import './global.css'

import {Lora} from 'next/font/google'
import {notFound} from 'next/navigation'
import {getServerSession} from 'next-auth'
import {NextIntlClientProvider} from 'next-intl'
import {ViewTransitions} from 'next-view-transitions'
import {Suspense} from 'react'

import {GoogleTagManager} from '@/components/lib/google-tag-manager'
import {ProgressbarProvider} from '@/components/providers/ProgressbarProvider'
import {SessionProvider} from '@/components/providers/SessionProvider'
import {ThemeProvider} from '@/components/providers/ThemeProvider'
import {Toaster} from '@/components/ui/toaster'
import {authOptions} from '@/lib/auth'
import {prepareMetadata} from '@/utils/prepareMetadata'

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
  const session = await getServerSession(authOptions)
  const messages = await getMessages(locale)

  return (
    <ViewTransitions>
      <html lang={locale}>
        <head />
        <body
          className={`${lora.className} flex flex-col overflow-x-hidden bg-background`}
        >
          <SessionProvider session={session} refetchOnWindowFocus>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                themes={['dark', 'light', 'navy']}
              >
                {children}
              </ThemeProvider>
            </NextIntlClientProvider>
          </SessionProvider>

          <ProgressbarProvider />
          <Toaster />

          <Suspense>
            <GoogleTagManager />
          </Suspense>
        </body>
      </html>
    </ViewTransitions>
  )
}
