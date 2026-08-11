import {Metadata} from 'next'

import {getLocale} from 'next-intl/server'

import {publicLocale} from '@/components/public-site/public-copy'
import {PublicFooter} from '@/components/public-site/public-footer'
import {PublicHeader} from '@/components/public-site/public-header'
import {Breadcrumb} from '@/components/seo/breadcrumb'
import {prepareMetadata} from '@/utils/prepare-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const locale = publicLocale(await getLocale())

  return prepareMetadata({contentLocale: locale})
}

type LayoutProps = {
  children: React.ReactNode
}

const skipLinkLabels: Record<string, string> = {
  en: 'Skip to main content',
  tr: 'Ana içeriğe geç',
  ru: 'Перейти к основному содержанию',
  ky: 'Негизги мазмунга өтүү',
  kg: 'Негизги мазмунга өтүү',
}

export default async function RootLayout({children}: LayoutProps) {
  const locale = publicLocale(await getLocale())

  return (
    <div className="heritage-site" id="layout-wrapper">
      <a href="#main-content" className="heritage-skip-link">
        {skipLinkLabels[locale] || skipLinkLabels.en}
      </a>
      <PublicHeader locale={locale} />
      <main id="main-content" tabIndex={-1}>
        <Breadcrumb showNavigation={false} />
        {children}
      </main>
      <PublicFooter locale={locale} />
    </div>
  )
}
