import {PublicPageTransition} from '@/components/public-site/public-view-transition'

interface TemplateProps {
  children: React.ReactNode
}

export default function Template({children}: TemplateProps) {
  return <PublicPageTransition>{children}</PublicPageTransition>
}
