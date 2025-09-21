import './global.css'

import {Metadata} from 'next'

import {Lora} from 'next/font/google'
import {notFound} from 'next/navigation'

import {NextIntlClientProvider} from 'next-intl'
import {ViewTransitions} from 'next-view-transitions'
import {Suspense} from 'react'

import {GoogleTagManager} from '@/components/lib/google-tag-manager'
import {
  MusicProvider,
  defaultTracks,
} from '@/components/providers/music-provider'
import {QueryProvider} from '@/components/providers/query-provider'
import {ThemeProvider} from '@/components/providers/theme-provider'
import {UserProvider} from '@/components/providers/user-provider'
import {HrefLang} from '@/components/seo/hreflang'
import {
  OrganizationStructuredData,
  PersonStructuredData,
  WebsiteStructuredData,
} from '@/components/seo/structured-data'
import {MusicPlayer} from '@/components/ui/music-player'
import {Toaster} from '@/components/ui/toaster'
import {ME} from '@/constants'
import {LOCALES} from '@/constants/locales'
import {prepareMetadata} from '@/utils/prepare-metadata'
import {getUser} from '@/utils/supabase/server'

const lora = Lora({subsets: ['latin']})

export async function generateMetadata(): Promise<Metadata> {
  return prepareMetadata()
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

  // Get initial user data for UserProvider
  const user = await getUser()

  // Determine domain for structured data
  const domain =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://bekten.art')

  return (
    <ViewTransitions>
      <html lang={locale} suppressHydrationWarning>
        <head>
          {/* Hreflang tags for multilingual SEO */}
          <HrefLang locales={LOCALES} defaultLocale="en" />

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
                defaultTheme="light"
                enableSystem
                themes={['light', 'dark', 'navy', 'system']}
              >
                <UserProvider initialUser={user}>
                  <MusicProvider defaultTracks={defaultTracks}>
                    {children}
                    <MusicPlayer />
                  </MusicProvider>
                </UserProvider>
              </ThemeProvider>
            </QueryProvider>
          </NextIntlClientProvider>

          <Toaster />

          <Suspense>
            <GoogleTagManager />
          </Suspense>

          {/* Structured Data */}
          <PersonStructuredData
            name={ME.fullName}
            alternateName="Bekten"
            description={ME.description}
            url={domain}
            image={`${domain}/me.jpg`}
            jobTitle={ME.job}
            nationality="Kyrgyzstani"
            birthPlace="Kyrgyzstan"
            sameAs={[
              `https://instagram.com/${ME.social.instagram}`,
              `https://wa.me/${ME.social.whatsapp}`,
            ]}
          />
          <OrganizationStructuredData
            name={ME.company.name}
            description="Contemporary art gallery and workshop by Bekten Usubaliev"
            url={domain}
            logo={`${domain}/logo.svg`}
            sameAs={[`https://instagram.com/${ME.social.instagram}`]}
            contactPoint={{
              telephone: `+${ME.social.phone}`,
              contactType: 'customer service',
            }}
          />
          <WebsiteStructuredData
            name={`${ME.fullName} - Artist Portfolio`}
            description={ME.description}
            url={domain}
          />
        </body>
      </html>
    </ViewTransitions>
  )
}
