import './global.css'

import {Metadata} from 'next'

import {headers} from 'next/headers'
import {notFound} from 'next/navigation'

import {NextIntlClientProvider} from 'next-intl'
import {Suspense} from 'react'

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
import {isPrivateDashboardPath} from '@/lib/private-dashboard-path'
import {publicSiteLocaleRegistry} from '@/server/site-locales/public-site-locales'
import {loadPublicMessages} from '@/server/translations/configured-translations'
import {prepareMetadata} from '@/utils/prepare-metadata'

export async function generateMetadata({
  params,
}: Pick<LayoutProps, 'params'>): Promise<Metadata> {
  const locale = publicLocale((await params).locale)

  return prepareMetadata({contentLocale: locale})
}

async function getMessages(locale: string) {
  try {
    return await loadPublicMessages(publicLocale(locale))
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
  const nonce = requestHeaders.get('x-nonce') ?? undefined
  const privateDashboard = isPrivateDashboardPath(
    requestHeaders.get('x-pathname') ?? '/',
  )
  const [messages, publicLocales] = await Promise.all([
    getMessages(currentLocale),
    privateDashboard ? Promise.resolve([]) : publicSiteLocaleRegistry.list(),
  ])
  const currentLocaleDefinition = publicLocales.find(
    localeDefinition => localeDefinition.code === currentLocale,
  )
  const identity = getSiteIdentity(currentLocale)

  // Determine domain for structured data
  const domain =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://bekten.art')

  return (
    <html
      data-scroll-behavior="smooth"
      dir={currentLocaleDefinition?.direction === 'RTL' ? 'rtl' : 'ltr'}
      lang={currentLocale}
      suppressHydrationWarning
    >
      <head>
        {privateDashboard ? null : (
          <HrefLang
            locales={publicLocales.map(localeDefinition => localeDefinition.code)}
            defaultLocale="en"
          />
        )}
      </head>
      <body
        className="bg-background text-foreground overflow-x-hidden"
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={currentLocale} messages={messages}>
          {privateDashboard ? (
            children
          ) : (
            <ConsentProvider>
              {children}
              <ConsentManager />

              <Suspense>
                <GoogleTagManager nonce={nonce} />
              </Suspense>
            </ConsentProvider>
          )}
        </NextIntlClientProvider>

        <Toaster />

        {privateDashboard ? null : (
          <>
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
          </>
        )}
      </body>
    </html>
  )
}
