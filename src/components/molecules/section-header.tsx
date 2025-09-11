'use client'

import {
  PaletteIcon,
  HeartIcon,
  SparklesIcon,
  NewspaperIcon,
  AwardIcon,
  GraduationCapIcon,
} from 'lucide-react'
import {ReactNode} from 'react'

import {useUser} from '@/components/providers/user-provider'
import {Badge} from '@/components/ui/badge'

interface SectionHeaderProps {
  badgeText: string
  badgeIcon?:
    | 'palette'
    | 'heart'
    | 'sparkles'
    | 'newspaper'
    | 'award'
    | 'graduation'
  title: string
  description?: string
  className?: string
  adminEditTrigger?: ReactNode
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
  className = '',
  adminEditTrigger,
}: SectionHeaderProps) {
  const IconComponent = badgeIcon ? iconMap[badgeIcon] : null
  const {user} = useUser()

  return (
    <div className={`relative mb-16 text-center ${className}`}>
      <Badge
        variant="secondary"
        className="bg-primary/10 text-primary border-primary/20 mb-4"
      >
        {IconComponent && <IconComponent className="mr-2 h-3 w-3" />}
        {badgeText}
      </Badge>
      <h2 className="mb-4 text-3xl font-bold lg:text-5xl">{title}</h2>
      {description && (
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          {description}
        </p>
      )}

      {/* Admin Edit Button */}
      {user?.isAdmin && adminEditTrigger && (
        <div className="absolute top-0 right-0">{adminEditTrigger}</div>
      )}
    </div>
  )
}
