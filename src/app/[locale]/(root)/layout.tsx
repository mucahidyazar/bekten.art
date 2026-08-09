import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/effect-fade'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'

import {Metadata} from 'next'

import {getLocale} from 'next-intl/server'

import {Footer} from '@/components/footer'
import {Header} from '@/components/organisms/header'
import {Breadcrumb} from '@/components/seo/breadcrumb'
import ProgressBar from '@/components/ui/progress-bar'
import {getUiUser} from '@/server/auth/ui-user'
import {prepareMetadata} from '@/utils/prepare-metadata'

import LayoutWrapper from './admin/components/layout-wrapper'

export async function generateMetadata(): Promise<Metadata> {
  return prepareMetadata()
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
  const [user, locale] = await Promise.all([getUiUser(), getLocale()])

  return (
    <LayoutWrapper>
      <div
        className="flex max-h-screen min-h-screen w-full flex-col overflow-y-auto"
        id="layout-wrapper"
      >
        <a
          href="#main-content"
          className="bg-background text-foreground focus-visible:ring-ring fixed top-4 left-4 z-[100] -translate-y-24 rounded-md border px-4 py-2 font-medium shadow-lg transition-transform focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {skipLinkLabels[locale] || skipLinkLabels.en}
        </a>
        <Header user={user} />
        <ProgressBar />
        <main id="main-content" tabIndex={-1} className="flex-1">
          <Breadcrumb />
          {children}
        </main>
        <Footer className="flex flex-col items-center gap-4 py-8" />
      </div>
    </LayoutWrapper>
  )
}
