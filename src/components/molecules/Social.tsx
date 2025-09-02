import {cn} from '@/utils'

// TODO: Define proper type with Supabase
type Social = {
  id: string
  platform: string
  url: string
}

type SocialProps = {
  className?: string
  socials: Social[]
}

export function Social({className, socials}: SocialProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <div className="mx-auto flex h-20 w-full items-center justify-center rounded bg-gray-100 dark:bg-slate-950">
        <p className="text-sm text-gray-500">
          Social links will be implemented with Supabase. Count: {socials?.length || 0}
        </p>
      </div>
    </div>
  )
}