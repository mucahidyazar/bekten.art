import './global.css'

import {Metadata} from 'next'

import {headers} from 'next/headers'
import {notFound} from 'next/navigation'

import {NextIntlClientProvider} from 'next-intl'
import {ViewTransitions} from 'next-view-transitions'
import {Suspense} from 'react'

import {ConsentBootstrap} from '@/components/consent/consent-bootstrap'
import {
  ConsentManager,
  ConsentProvider,
} from '@/components/consent/consent-provider'
import {GoogleTagManager} from '@/components/lib/google-tag-manager'
import {MusicProvider} from '@/components/providers/music-provider'
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
import {getUiUser} from '@/server/auth/ui-user'
import {prepareMetadata} from '@/utils/prepare-metadata'

import {resolveMessagesLocale} from '../../../i18n'

export async function generateMetadata(): Promise<Metadata> {
  return prepareMetadata()
}

async function getMessages(locale: string) {
  try {
    const messagesLocale = resolveMessagesLocale(locale)

    return (
      await import(`../../../public/locales/${messagesLocale}/common.json`)
    ).default
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
  const [{locale}, requestHeaders] = await Promise.all([params, headers()])
  const messages = await getMessages(locale)
  const nonce = requestHeaders.get('x-nonce') ?? undefined

  // Get initial user data for UserProvider
  const user = await getUiUser()

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
          <ConsentBootstrap nonce={nonce} />

          {/* Hreflang tags for multilingual SEO */}
          <HrefLang locales={LOCALES} defaultLocale="en" />
        </head>
        <body
          className="font-editorial bg-background flex flex-col overflow-x-hidden"
          suppressHydrationWarning
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ConsentProvider>
              <QueryProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem
                  themes={['light', 'dark', 'navy', 'system']}
                >
                  <UserProvider initialUser={user}>
                    <MusicProvider>
                      {children}
                      <MusicPlayer />
                      <ConsentManager />
                    </MusicProvider>
                  </UserProvider>
                </ThemeProvider>
              </QueryProvider>

              <Suspense>
                <GoogleTagManager nonce={nonce} />
              </Suspense>
            </ConsentProvider>
          </NextIntlClientProvider>

          <Toaster />

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
