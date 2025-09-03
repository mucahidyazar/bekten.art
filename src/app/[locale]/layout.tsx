import './global.css'

import {Lora} from 'next/font/google'
import {notFound} from 'next/navigation'
import {NextIntlClientProvider} from 'next-intl'
import {ViewTransitions} from 'next-view-transitions'
import {Suspense} from 'react'

import {GoogleTagManager} from '@/components/lib/google-tag-manager'
import {
  MusicProvider,
  defaultTracks,
} from '@/components/providers/MusicProvider'
import {QueryProvider} from '@/components/providers/QueryProvider'
import {ThemeProvider} from '@/components/providers/ThemeProvider'
import {MusicPlayer} from '@/components/ui/MusicPlayer'
import {Toaster} from '@/components/ui/toaster'
import {prepareMetadata} from '@/utils/prepareMetadata'

const lora = Lora({subsets: ['latin']})

export async function generateMetadata() {
  return await prepareMetadata()
}

async function getMessages(locale: string) {
  try {
    return (await import(`../../../public/locales/${locale}/common.json`))
      .default
  } catch {
    notFound()
  }
}

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}
export default async function RootLayout({children, params}: LayoutProps) {
  const {locale} = await params
  const messages = await getMessages(locale)

  return (
    <ViewTransitions>
      <html lang={locale} suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Prevent hydration mismatch from browser extensions
                if (typeof window !== 'undefined') {
                  const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                      if (mutation.type === 'attributes') {
                        const target = mutation.target;
                        if (target && target.hasAttribute && target.hasAttribute('bis_skin_checked')) {
                          target.removeAttribute('bis_skin_checked');
                        }
                      }
                    });
                  });
                  document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['bis_skin_checked']
                    });
                  });
                }
              `,
            }}
          />
        </head>
        <body
          className={`${lora.className} bg-background flex flex-col overflow-x-hidden`}
          suppressHydrationWarning
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                themes={['light', 'dark', 'navy', 'system']}
              >
                <MusicProvider defaultTracks={defaultTracks}>
                  {children}
                  <MusicPlayer />
                </MusicProvider>
              </ThemeProvider>
            </QueryProvider>
          </NextIntlClientProvider>

          <Toaster />

          <Suspense>
            <GoogleTagManager />
          </Suspense>
        </body>
      </html>
    </ViewTransitions>
  )
}
