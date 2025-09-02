'use client'

import { PaletteIcon, HeartIcon, SparklesIcon, NewspaperIcon, AwardIcon, GraduationCapIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

interface SectionHeaderProps {
  badgeText: string
  badgeIcon?: 'palette' | 'heart' | 'sparkles' | 'newspaper' | 'award' | 'graduation'
  title: string
  description?: string
  className?: string
}

const iconMap = {
  palette: PaletteIcon,
  heart: HeartIcon,
  sparkles: SparklesIcon,
  newspaper: NewspaperIcon,
  award: AwardIcon,
  graduation: GraduationCapIcon,
}

export function SectionHeader({
  badgeText,
  badgeIcon,
  title,
  description,
  className = ""
}: SectionHeaderProps) {
  const IconComponent = badgeIcon ? iconMap[badgeIcon] : null

  return (
    <div className={`text-center mb-16 ${className}`}>
      <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
        {IconComponent && <IconComponent className="w-3 h-3 mr-2" />}
        {badgeText}
      </Badge>
      <h2 className="text-3xl lg:text-5xl font-bold mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}
