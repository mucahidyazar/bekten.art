'use client'

import {PageTransition} from '@/components/providers/page-transition'

interface TemplateProps {
  children: React.ReactNode
}

export default function AdminTemplate({children}: TemplateProps) {
  // Sadece content'e PageTransition uygula, sidebar ve header sabit kalsın
  return <PageTransition>{children}</PageTransition>
}
