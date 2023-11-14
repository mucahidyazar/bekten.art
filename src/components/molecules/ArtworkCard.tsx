'use client'
import {HeartIcon} from '@heroicons/react/24/outline'
import {Artwork, ArtworkLike, Social as SocialType, User} from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import {useState} from 'react'

import {cn} from '@/utils'

import {Badge} from '../ui/badge'
import {Button} from '../ui/button'

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
  const {name, description, price, images, artist, likes, buyLink, nftLink} =
    artwork

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  console.log({artwork})
  return (
    // <div className="box-border inline-block w-60 rounded-md bg-white bg-[length:400%_400%] p-[0.1rem] duration-150 hover:animate-border hover:bg-gradient-to-r hover:from-primary-500 hover:to-purple-500">
    <div className="relative w-60 min-w-[15rem] rounded border border-gray-300 bg-white p-2 hover:shadow-sm">
      {/* <div className="absolute left-0 top-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" />
      <div className="absolute right-0 top-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" />
      <div className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" /> */}

      <div className="relative">
        <Image
          src={images?.[selectedImageIndex] || '/usubaliev_2.jpg'}
          alt="Placeholder"
          width={200}
          height={200}
          className="h-60 w-full rounded-sm object-cover"
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
        <div className="mb-2 mt-1 flex items-center justify-between text-xs text-foreground">
          <p className="group flex cursor-pointer items-center gap-1">
            <HeartIcon className="w-4 duration-150 hover:animate-pulse group-hover:scale-125 group-hover:text-primary-500" />
            {likes && <p>{likes.length}</p>}
          </p>
          <Link href={`/profile/${artist.id}`}>
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
            <Button variant="outline" className="flex-grow">
              <Link href={buyLink}>Buy as NFT Only ${price}</Link>
            </Button>
          )}

          {nftLink && (
            <Button variant="outline" className="!text-white">
              <Link href={nftLink}>Buy as NFT</Link>
            </Button>
          )}
        </section>
      )}

      {!(buyLink || nftLink) && (
        <>
          <div className="mb-2 mt-4 border-b border-gray-300" />
          <Social
            socials={artwork.artist?.socials as SocialType[]}
            className="justify-center text-foreground"
          />
        </>
      )}
    </div>
    // </div>
  )
}
