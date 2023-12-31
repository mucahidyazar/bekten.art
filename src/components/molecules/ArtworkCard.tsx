'use client'
import {Artwork, ArtworkLike, Social as SocialType, User} from '@prisma/client'
import {HeartIcon, MoreVerticalIcon, PencilIcon, TrashIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {useSession} from 'next-auth/react'
import {useState} from 'react'

import {removeArtwork} from '@/actions'
import {useServerAction} from '@/hooks/useServerAction'
import {cn} from '@/utils'

import {Badge} from '../ui/badge'
import {Button} from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

import {Social} from './Social'

type ArtworkCardProps = {
  artwork: Partial<
    Artwork & {
      artist: Partial<User> & {
        socials: SocialType[]
      }
      likes?: ArtworkLike[]
    }
  >
}
export function ArtworkCard({artwork}: ArtworkCardProps) {
  const session = useSession()
  const [action, isPending] = useServerAction(removeArtwork)
  const {name, description, price, images, artist, likes, buyLink, nftLink} =
    artwork

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  return (
    // <div className="box-border inline-block w-60 rounded-md bg-white bg-[length:400%_400%] p-[0.1rem] duration-150 hover:animate-border hover:bg-gradient-to-r hover:from-primary-500 hover:to-purple-500">
    <div className="relative w-60 min-w-[15rem] rounded border border-gray-300 bg-white p-2 hover:shadow-sm">
      {/* <div className="absolute left-0 top-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" />
      <div className="absolute right-0 top-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" />
      <div className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" /> */}

      <div className="relative h-60 shadow">
        <Image
          src={images?.[selectedImageIndex] || '/usubaliev_2.jpg'}
          alt="Placeholder"
          width={240}
          height={240}
          className="h-full w-full rounded-sm object-cover"
        />
        <Badge
          className={cn(
            'absolute bottom-2 right-2 bg-green-500 bg-opacity-80 hover:bg-green-500',
            artwork.status === 'SOLD' && 'bg-red-500 hover:bg-red-500',
          )}
        >
          {artwork.status}
        </Badge>
        <div className="absolute bottom-2 right-[50%] flex translate-x-1/2 transform items-center gap-1">
          {images?.map((image, imageIndex) => (
            <div
              key={image}
              className={cn(
                'cursor-pointer rounded-full bg-white bg-opacity-60 p-1 duration-150 hover:bg-opacity-100',
                imageIndex === selectedImageIndex && 'bg-primary-700',
              )}
              onClick={() => {
                setSelectedImageIndex(imageIndex)
              }}
            />
          ))}
        </div>

        {/* <div className="absolute bottom-1 left-1 flex  transform items-center gap-2 rounded bg-black bg-opacity-60 p-1">
        <Image
          src="/usubaliev_1.jpg"
          alt="Artist"
          width={200}
          height={200}
          className="h-6 w-6 rounded object-cover"
        />
        <div className="flex-grow">
          <p className="text-xs">Bekten Usubaliev</p>
        </div>
      </div> */}
      </div>
      {artist && (
        <div className="group mb-2 mt-1 flex items-center justify-between text-xs  text-black">
          <p className="flex cursor-pointer items-center gap-1">
            <HeartIcon className="w-4 duration-150 hover:animate-pulse hover:text-primary-500 group-hover:scale-125" />
            {likes && <p>{likes.length}</p>}
          </p>
          <Link
            href={`/profile/${artist.id}`}
            className="hover:text-primary-500"
          >
            by <span className="underline">{artist.name}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-1 text-center text-black">
        <h2 className="font-bold">{name}</h2>
        {description && <p className="line-clamp-3 text-xs">{description}</p>}
      </div>

      {(buyLink || nftLink) && (
        <section className="mt-4 flex flex-col gap-2">
          {buyLink && (
            <a href={buyLink} target="_blank">
              <Button variant="outline" className="w-full flex-grow">
                Only ${price}
              </Button>
            </a>
          )}

          {nftLink && (
            <a href={nftLink} target="_blank">
              <Button variant="outline" className="w-full">
                Buy as NFT
              </Button>
            </a>
          )}
        </section>
      )}

      {!(buyLink || nftLink) && !!artwork.artist?.socials.length && (
        <>
          <div className="mb-2 mt-4 border-b border-gray-300" />
          <Social
            socials={artwork.artist?.socials as SocialType[]}
            className="justify-center text-foreground"
          />
        </>
      )}

      {session.data?.user.role === 'ADMIN' && (
        <DropdownMenu>
          <DropdownMenuTrigger className="absolute right-4 top-4 z-20 grid h-8 w-6 place-items-center rounded bg-white p-0 shadow">
            <MoreVerticalIcon className="w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <Button variant="ghost" className="w-full justify-start gap-2 p-2">
              <PencilIcon className="w-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 p-2"
              onClick={() => {
                action({id: artwork.id as string})
              }}
              disabled={isPending}
              isLoading={isPending}
            >
              <TrashIcon className="w-4" />
              Delete
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
    // </div>
  )
}
