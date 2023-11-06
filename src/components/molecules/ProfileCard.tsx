'use client'
import {MapIcon, PencilIcon} from '@heroicons/react/24/outline'
import {Social as SocialType, User} from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import {useParams} from 'next/navigation'
import {useSession} from 'next-auth/react'

import {Button} from '../ui/button'
import {Switch} from '../ui/switch'

import {Social} from './Social'

type ProfileCardProps = {
  user: User & {
    socials: SocialType[]
  }
  showPermissions?: boolean
}
export function ProfileCard({user, showPermissions = false}: ProfileCardProps) {
  const me = useSession()
  const params = useParams()

  const isMe = me.data?.user.id === params.id
  const isAdmin = me.data?.user.role === 'ADMIN'

  return (
    <div className="relative rounded bg-foreground text-background">
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

      <div className="mt-2 flex flex-col px-8 py-2 text-center">
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
          <div className="my-2 h-[1px] bg-background" />
          <div className="flex flex-col gap-2 px-2">
            {/* permissions */}
            {/* 1. Kullanici profili public olsun mu */}
            <div className="flex gap-2">
              <Switch id="public-profile" />
              <div className="flex flex-col">
                <label
                  htmlFor="public-profile"
                  className="text-sm font-medium leading-6 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Public Profile
                </label>
                <span className="text-[10px]">
                  This will make your profile visible to everyone on the
                  internet.
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Switch id="show-some-datas" />
              <div className="flex flex-col">
                <label
                  htmlFor="show-some-datas"
                  className="text-sm font-medium leading-6 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Show Some Datas
                </label>
                <span className="text-[10px]">
                  This will allow you to show your likes, comments, profile
                  photo to everyone on the showcase, arts, and blog
                </span>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="my-2 h-[1px] bg-background" />
      <Social
        socials={user.socials}
        className="my-2 justify-center text-background"
      />

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
