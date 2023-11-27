'use client'
import {Social as SocialType, User} from '@prisma/client'
import {MapIcon, PencilIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {useParams} from 'next/navigation'
import {useSession} from 'next-auth/react'

import {updatePermission} from '@/actions'
import {useServerAction} from '@/hooks/useServerAction'
import {cn} from '@/utils'

import {Badge} from '../ui/badge'
import {Button} from '../ui/button'
import {Switch} from '../ui/switch'

import {Social} from './Social'

const permissions = [
  {
    id: 'shareData',
    title: 'Public Profile',
    description:
      'This will make your profile visible to everyone on the internet.',
  },
  {
    id: 'shareSomeData',
    title: 'Show Some Datas',
    description:
      'This will allow you to show your likes, comments, profile photo to everyone on the showcase, arts, and blog',
  },
]
type ProfileCardProps = {
  user: User & {
    socials: SocialType[]
  }
  showPermissions?: boolean
  className?: string
}
export function ProfileCard({
  user,
  showPermissions = false,
  className,
}: ProfileCardProps) {
  const [action, isPending] = useServerAction(updatePermission)
  const me = useSession()
  const params = useParams()

  const isMe = me.data?.user.id === params.id
  const isAdmin = me.data?.user.role === 'ADMIN'

  return (
    <div
      className={cn(
        'relative rounded border border-gray-200 text-foreground',
        className,
      )}
    >
      {/* <div className="absolute left-0 top-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" />
      <div className="absolute right-0 top-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" />
      <div className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" /> */}

      <div className="relative">
        <Image
          src={user.image || ''}
          alt="Placeholder"
          width={200}
          height={200}
          className="h-60 w-full rounded-sm object-cover"
        />
        <Badge className="absolute bottom-2 right-2">{user.role}</Badge>
      </div>

      <div className="mt-2 flex flex-col px-4 text-center">
        <h2 className="font-bold">{user.name}</h2>
        <p className="text-sm">
          {user.profession} @{user.name}
        </p>
        {user.location && (
          <p className="my-2 flex items-center justify-center gap-1 text-xs">
            <MapIcon className="w-3" />
            {user.location}
          </p>
        )}
        <p className="line-clamp-3 text-xs">{user.description}</p>
      </div>

      {showPermissions && isMe && (
        <>
          <div className="mx-auto my-8 h-[1px] w-[calc(100%-2rem)] bg-gray-200" />
          <div className="flex flex-col gap-2 px-4">
            {permissions.map(permission => (
              <div className="flex gap-2" key={permission.id}>
                <Switch
                  id="public-profile"
                  defaultChecked={(user as any)[permission.id]}
                  onCheckedChange={value => {
                    action({
                      [permission.id]: value,
                    })
                  }}
                  disabled={isPending}
                />
                <div className="flex flex-col">
                  <label
                    htmlFor="public-profile"
                    className="text-sm font-medium leading-6 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.title}
                  </label>
                  <span className="text-[10px]">{permission.description}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="mx-auto mb-6 mt-8 h-[1px] w-[calc(100%-2rem)] bg-gray-200" />
      <Social socials={user.socials} className="my-2 justify-center" />

      {(isAdmin || isMe) && (
        <Link href={`/profile/${user.id}/edit`}>
          <Button
            type="button"
            className="absolute right-2 top-2 h-10 w-10 p-0"
          >
            <PencilIcon className="w-4" />
          </Button>
        </Link>
      )}
    </div>
  )
}
