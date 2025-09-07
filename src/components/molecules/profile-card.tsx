'use client'

import {cn} from '@/utils'

// TODO: Define proper types with Supabase
type SocialType = {
  id: string
  platform: string
  url: string
}

type User = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  socials: SocialType[]
}

type ProfileCardProps = {
  user: User
  showPermissions?: boolean
  className?: string
}

export function ProfileCard({user, showPermissions, className}: ProfileCardProps) {
  return (
    <div className={cn("rounded border p-4", className)}>
      <div className="mx-auto flex h-40 w-full items-center justify-center rounded bg-gray-100 dark:bg-slate-950">
        <p className="text-sm text-gray-500">
          Profile card will be implemented with Supabase. User: {user?.name || user?.email}
          {showPermissions && " (with permissions)"}
        </p>
      </div>
    </div>
  )
}
