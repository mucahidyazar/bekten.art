'use client'
import Image from 'next/image'
import {useState} from 'react'

import {ArtImage} from '@/components/molecules/ArtImage'
import {useEventListener} from '@/hooks/useEventListener'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'

type SectionData = {
  url: string
  title: string
  description: string
}
type GalleryTemplateProps = {
  imageArrays: SectionData[][]
}
export function GalleryTemplate({imageArrays = []}: GalleryTemplateProps) {
  const [image, setImage] = useState<SectionData | null>(null)

  const handleKeyPress = (e: KeyboardEvent) => {
    if (image) {
      const allImages = imageArrays.flat()
      if (e.key === 'ArrowRight') {
        const index = allImages.findIndex(item => item.url === image.url)
        if (index < allImages.length - 1) {
          setImage(allImages[index + 1])
        } else {
          setImage(allImages[0]) // Başa dön
        }
      } else if (e.key === 'ArrowLeft') {
        const index = allImages.findIndex(item => item.url === image.url)
        if (index > 0) {
          setImage(allImages[index - 1])
        }
      }
    }
  }

  useEventListener('keydown', handleKeyPress)

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-8">
      <Dialog>
        {imageArrays.map((imageArray, imageArrayIndex) => (
          <div
            className="flex flex-col gap-4 lg:gap-8"
            key={imageArrayIndex.toString()}
          >
            {imageArray.map((image, imageIndex) => (
              <DialogTrigger
                key={imageArrayIndex.toString() + imageIndex.toString()}
                onClick={() => setImage(image)}
              >
                <ArtImage
                  src={image.url}
                  description={image.description}
                  className="h-auto w-full rounded-lg saturate-50 duration-300 hover:scale-[103%] hover:saturate-100 lg:hover:scale-110"
                />
              </DialogTrigger>
            ))}
          </div>
        ))}

        {image && (
          <DialogContent className="flex h-full w-fit flex-col bg-white p-2 sm:h-auto sm:p-4 lg:rounded">
            <DialogHeader>
              <DialogTitle>{image.title}</DialogTitle>
              <DialogDescription>{image.description}</DialogDescription>
            </DialogHeader>
            <div className="flex h-full flex-grow flex-col overflow-hidden">
              <Image
                src={image.url}
                alt={image.description}
                width={1000}
                height={1000}
                className="h-full max-h-[80vh] w-fit"
              />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
