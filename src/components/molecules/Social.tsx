import {Social} from '@prisma/client'

import {cn} from '@/utils'

import {Icons} from '../ui/icons'

type SocialProps = {
  socials: Social[]
  className?: string
}
export function Social({className, socials}: SocialProps) {
  return (
    <div className={cn('flex gap-4 text-foreground', className)}>
      {socials.map(social => {
        const IconComponent = (Icons as any)[social.platform]
        return (
          <a
            key={social.platform}
            href={social.url}
            className="flex items-center gap-2 transition-all duration-300 ease-in-out hover:scale-125 hover:text-primary-900"
          >
            {IconComponent && <IconComponent className="w-4" />}
          </a>
        )
      })}
    </div>
  )
}
