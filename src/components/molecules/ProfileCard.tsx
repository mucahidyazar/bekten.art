'use client'
import {MapIcon, PencilIcon} from '@heroicons/react/24/outline'
import {Social as SocialType, User} from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import {useParams} from 'next/navigation'
import {useSession} from 'next-auth/react'

import {Button} from '../ui/button'

import {Social} from './Social'

type ProfileCardProps = {
  user: User & {
    socials: SocialType[]
  }
}
export function ProfileCard({user}: ProfileCardProps) {
  const me = useSession()
  const params = useParams()

  return (
    <div className="relative rounded bg-white">
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
      </div>

      <div className="mt-2 flex flex-col py-2 text-center text-black">
        <h2 className="font-bold">{user.name}</h2>
        <p className="text-sm">
          {user.profession} @{user.name}
        </p>
        <p className="my-2 flex items-center justify-center gap-1 text-xs">
          <MapIcon className="w-3" />
          {user.location}
        </p>
        <p className="line-clamp-3 text-sm">{user.description}</p>
      </div>

      <div className="my-2 h-[1px] bg-background" />
      <Social
        socials={user.socials}
        className="my-2 justify-center text-background"
      />

      {(me.data?.user.role === 'ADMIN' || user.id === params.id) && (
        <Link href={`/profile/${user.id}/edit`}>
          <Button
            type="button"
            className="absolute right-2 top-2 h-10 w-10 p-0"
          >
            <PencilIcon className="w-4 text-background" />
          </Button>
        </Link>
      )}
    </div>
  )
}
