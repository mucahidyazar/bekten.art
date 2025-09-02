'use client'

import { UserIcon, ShieldCheckIcon, BadgeCheckIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

const iconMap = {
  user: UserIcon,
  shield: ShieldCheckIcon,
  badge: BadgeCheckIcon,
}

type RoleBadgeProps = {
  icon: keyof typeof iconMap
  label: string
  className?: string
}

export function RoleBadge({ icon, label, className }: RoleBadgeProps) {
  const IconComponent = iconMap[icon]
  
  return (
    <Badge 
      variant="secondary"
      className={`bg-primary/10 hover:bg-primary/20 border border-primary/20 !text-primary px-3 py-1.5 text-sm font-medium rounded-lg ${className}`}
    >
      <IconComponent className="w-3 h-3 mr-2" />
      {label}
    </Badge>
  )
}