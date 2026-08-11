import {PublicPageTransition} from '@/components/public-site/public-view-transition'

type DashboardTemplateProps = Readonly<{children: React.ReactNode}>

export default function DashboardTemplate({children}: DashboardTemplateProps) {
  return <PublicPageTransition>{children}</PublicPageTransition>
}
