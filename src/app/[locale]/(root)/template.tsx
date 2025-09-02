'use client'

import {PageTransition} from '@/components/providers/PageTransition'

interface TemplateProps {
  children: React.ReactNode
}

export default function Template({children}: TemplateProps) {
  return <PageTransition>{children}</PageTransition>
}
