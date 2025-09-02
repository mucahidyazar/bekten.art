import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import 'swiper/css/effect-fade'

import {Footer} from '@/components/Footer'
import {Header} from '@/components/organisms/Header'
import ProgressBar from '@/components/ui/progress-bar'
import {prepareMetadata} from '@/utils/prepareMetadata'

import LayoutWrapper from './admin/components/LayoutWrapper'

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
