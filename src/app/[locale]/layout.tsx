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
import {publicLocale} from '@/components/public-site/public-copy'
import {HrefLang} from '@/components/seo/hreflang'
import {getSiteIdentity, SITE_NAME} from '@/components/seo/site-identity'
import {
  OrganizationStructuredData,
  PersonStructuredData,
  WebsiteStructuredData,
} from '@/components/seo/structured-data'
import {Toaster} from '@/components/ui/toaster'
import {ME} from '@/constants'
import {LOCALES} from '@/constants/locales'
import {prepareMetadata} from '@/utils/prepare-metadata'

import {resolveMessagesLocale} from '../../../i18n'

export async function generateMetadata({
  params,
}: Pick<LayoutProps, 'params'>): Promise<Metadata> {
  const locale = publicLocale((await params).locale)

  return prepareMetadata({contentLocale: locale})
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
  const currentLocale = publicLocale(locale)
  const messages = await getMessages(currentLocale)
  const nonce = requestHeaders.get('x-nonce') ?? undefined
  const identity = getSiteIdentity(currentLocale)

  // Determine domain for structured data
  const domain =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://bekten.art')

  return (
    <ViewTransitions>
      <html lang={currentLocale} suppressHydrationWarning>
        <head>
          <ConsentBootstrap nonce={nonce} />

          {/* Hreflang tags for multilingual SEO */}
          <HrefLang locales={LOCALES} defaultLocale="en" />
        </head>
        <body
          className="bg-background text-foreground overflow-x-hidden"
          suppressHydrationWarning
        >
          <NextIntlClientProvider locale={currentLocale} messages={messages}>
            <ConsentProvider>
              {children}
              <ConsentManager />

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
            description={identity.artistDescription}
            url={domain}
            image={`${domain}/me.jpg`}
            jobTitle={identity.jobTitle}
            nationality="Kyrgyzstani"
            birthPlace="Kyrgyzstan"
            sameAs={[`https://instagram.com/${ME.social.instagram}`]}
          />
          <OrganizationStructuredData
            name="Bekten Studio"
            description={identity.organizationDescription}
            url={domain}
            logo={`${domain}/svg/full-logo.svg`}
            sameAs={[`https://instagram.com/${ME.social.instagram}`]}
          />
          <WebsiteStructuredData
            name={SITE_NAME}
            description={identity.siteDescription}
            url={domain}
          />
        </body>
      </html>
    </ViewTransitions>
  )
}
