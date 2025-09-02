'use client'

import {
  PaletteIcon,
  GraduationCapIcon,
  HeartIcon,
  UserIcon,
  ShieldCheckIcon,
  BadgeCheckIcon,
} from 'lucide-react'
import Image from 'next/image'

import {Badge} from '@/components/ui/badge'

// Icon mapping for server-to-client component communication
const iconMap = {
  palette: PaletteIcon,
  graduation: GraduationCapIcon,
  heart: HeartIcon,
  user: UserIcon,
  shield: ShieldCheckIcon,
  badge: BadgeCheckIcon,
}

type IconType = keyof typeof iconMap

interface ArtistHeroProps {
  name?: string
  title?: string
  quote?: string
  imageUrl?: string
  badges?: Array<{
    icon: IconType
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
  className?: string
}

export function ArtistHero({
  name = 'Bekten Usubaliev',
  title = 'Kyrgyz Painter & Art Lecturer',
  quote = 'Art is the language of the soul, speaking truths that words cannot express.',
  imageUrl = '/me.jpg',
  badges = [
    {icon: 'palette', label: 'Artist'},
    {icon: 'graduation', label: 'Lecturer'},
    {icon: 'heart', label: 'Passionate'},
  ],
  className = '',
}: ArtistHeroProps) {
  const [firstName, lastName] = name.split(' ')

  return (
    <div className={`mb-16 ${className}`}>
      <div className="grid items-center gap-12 md:grid-cols-3">
        {/* Profile Image - Clean and Simple */}
        <div className="relative col-span-1 w-full">
          <Image
            src={imageUrl}
            alt={name}
            width={400}
            height={400}
            className="h-auto w-full rounded-2xl object-cover shadow-lg"
            priority
          />
        </div>

        {/* Hero Content - Minimal and Clean */}
        <div className="space-y-8 md:col-span-2">
          <div className="space-y-4">
            <h1 className="text-4xl leading-tight font-bold md:text-6xl">
              <span className="text-foreground block">{firstName}</span>
              {lastName && (
                <span className="text-primary block">{lastName}</span>
              )}
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed font-light md:text-2xl">
              {title}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {badges.map((badge, index) => {
              const IconComponent = iconMap[badge.icon]
              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-medium"
                >
                  <IconComponent className="mr-2 h-4 w-4" />
                  {badge.label}
                </Badge>
              )
            })}
          </div>

          {quote && (
            <blockquote className="text-muted-foreground border-primary/30 border-l-4 pl-6 text-lg leading-relaxed italic">
              &ldquo;{quote}&rdquo;
            </blockquote>
          )}
        </div>
      </div>
    </div>
  )
}
