import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/effect-fade'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'

import {Footer} from '@/components/footer'
import {Header} from '@/components/organisms/header'
import ProgressBar from '@/components/ui/progress-bar'
import {prepareMetadata} from '@/utils/prepare-metadata'

import LayoutWrapper from './admin/components/layout-wrapper'

export async function generateMetadata() {
  return await prepareMetadata()
}

type LayoutProps = {
  children: React.ReactNode
}
export default async function RootLayout({children}: LayoutProps) {
  return (
    <LayoutWrapper>
      <div className="flex max-h-screen min-h-screen w-full flex-col overflow-y-auto">
        <Header />
        <ProgressBar />
        <main className="flex-1">{children}</main>
        <Footer className="flex flex-col items-center gap-4 py-8" />
      </div>
    </LayoutWrapper>
  )
}
