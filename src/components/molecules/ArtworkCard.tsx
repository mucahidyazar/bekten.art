'use client'
import {HeartIcon} from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import {useState} from 'react'

import {ArtworkCardProps} from '@/common'
import {cn} from '@/utils'

import {Button} from '../ui/button'

export function ArtworkCard({artwork}: ArtworkCardProps) {
  const {name, description, price, images, artist, likes, nftLink} = artwork

  const imagesData =
    images ||
    Array.from((images as MediaSource[]) || [])?.map(image => {
      return URL.createObjectURL(image)
    })

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  return (
    <div className="relative w-60 rounded bg-white p-4">
      <div className="absolute left-0 top-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" />
      <div className="absolute right-0 top-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" />
      <div className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-primary-500 bg-opacity-40 blur-md" />

      <div className="relative">
        <Image
          src={imagesData[selectedImageIndex] || '/usubaliev_2.jpg'}
          alt="Placeholder"
          width={200}
          height={200}
          className="h-40 w-full rounded-sm object-cover"
        />
        <div className="absolute bottom-2 right-[50%] flex translate-x-1/2 transform items-center gap-1">
          {imagesData?.map((image, imageIndex) => (
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
        <div className="mb-1 flex-grow text-background">
          <p className="text-xs">
            by <span className="underline">{artist.name}</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 text-center text-black">
        <h2 className="font-bold">{name}</h2>
        {description && <p className="text-xs">{description}</p>}

        <section className="flex flex-col gap-2">
          <section className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-grow !bg-transparent hover:!bg-background"
            >
              Only ${price}
            </Button>
            <Button
              variant="default"
              className="flex gap-1 !bg-background px-2 !text-foreground"
            >
              <HeartIcon width={18} />
              {likes && <p>{likes.length}</p>}
            </Button>
          </section>

          {nftLink && (
            <Button variant="outline" className="!text-white">
              <Link href={nftLink}>Buy as NFT</Link>
            </Button>
          )}
        </section>
      </div>
    </div>
  )
}
