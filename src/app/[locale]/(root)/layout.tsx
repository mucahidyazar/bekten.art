import {Metadata} from 'next'

import {notFound} from 'next/navigation'

import {publicLocale} from '@/components/public-site/public-copy'
import {PublicFooter} from '@/components/public-site/public-footer'
import {PublicHeader} from '@/components/public-site/public-header'
import {Breadcrumb} from '@/components/seo/breadcrumb'
import {publicSiteLocaleRegistry} from '@/server/site-locales/public-site-locales'
import {prepareMetadata} from '@/utils/prepare-metadata'

export async function generateMetadata({
  params,
}: Pick<LayoutProps, 'params'>): Promise<Metadata> {
  const locale = publicLocale((await params).locale)

  return prepareMetadata({contentLocale: locale})
}

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{locale: string}>
}

const skipLinkLabels: Record<string, string> = {
  en: 'Skip to main content',
  tr: 'Ana içeriğe geç',
  ru: 'Перейти к основному содержанию',
  ky: 'Негизги мазмунга өтүү',
  kg: 'Негизги мазмунга өтүү',
}

export default async function RootLayout({children, params}: LayoutProps) {
  const locale = publicLocale((await params).locale)
  const [activeLocale, activeLocales] = await Promise.all([
    publicSiteLocaleRegistry.resolve(locale),
    publicSiteLocaleRegistry.list(),
  ])

  if (!activeLocale) notFound()

  return (
    <div className="heritage-site" id="layout-wrapper">
      <a href="#main-content" className="heritage-skip-link">
        {skipLinkLabels[locale] || skipLinkLabels.en}
      </a>
      <PublicHeader
        locale={locale}
        locales={activeLocales.map(candidate => ({
          code: candidate.code,
          nativeName: candidate.nativeName,
        }))}
      />
      <main id="main-content" tabIndex={-1}>
        <Breadcrumb showNavigation={false} />
        {children}
      </main>
      <PublicFooter locale={locale} />
    </div>
  )
}
