'use client'

// TODO: Define proper types with Supabase
type Social = {
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
  socials: Social[]
}

type ProfileFormProps = {
  userDetail: User
}

export function ProfileForm({userDetail}: ProfileFormProps) {
  return (
    <div className="mx-auto flex h-40 w-full items-center justify-center rounded bg-gray-100 dark:bg-slate-950">
      <p className="text-sm text-gray-500">
        Profile form will be implemented with Supabase. User: {userDetail?.name || userDetail?.email}
      </p>
    </div>
  )
}