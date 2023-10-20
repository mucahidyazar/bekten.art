'use client'
import Image from 'next/image'
import {useState} from 'react'

import {useEventListener} from '@/hooks/useEventListener'

import {ArtImage} from '../molecules'
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
type HomeSectionProps = {
  title: string
  data: SectionData[]
}
export function HomeSection({title, data}: HomeSectionProps) {
  const [image, setImage] = useState<SectionData | null>(null)

  const handleKeyPress = (e: KeyboardEvent) => {
    if (image) {
      if (e.key === 'ArrowRight') {
        const index = data.findIndex(item => item.url === image.url)
        if (index < data.length - 1) {
          setImage(data[index + 1])
        } else {
          setImage(data[0]) // Başa dön
        }
      } else if (e.key === 'ArrowLeft') {
        const index = data.findIndex(item => item.url === image.url)
        if (index > 0) {
          setImage(data[index - 1])
        }
      }
    }
  }

  useEventListener('keydown', handleKeyPress)

  return (
    <aside className="w-full">
      <Dialog>
        <h3 className="text-2xl font-semibold mb-2">{title}</h3>
        <div className="flex gap-2 w-full overflow-auto">
          {data.map(item => (
            <DialogTrigger key={item.url} onClick={() => setImage(item)}>
              <ArtImage
                src={item.url}
                description={item.title}
                className="h-60 w-40 min-w-[10rem] rounded-lg"
                imageClassName="object-cover h-full group-hover:scale-125 duration-500"
              />
            </DialogTrigger>
          ))}
        </div>

        {image && (
          <DialogContent className="bg-white lg:rounded h-full sm:h-auto flex flex-col p-2 sm:p-4 w-fit">
            <DialogHeader>
              <DialogTitle>{image.title}</DialogTitle>
              <DialogDescription>{image.description}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center flex-grow h-full overflow-hidden">
              <Image
                src={image.url}
                alt={image.description}
                width={1000}
                height={1000}
                className="max-h-[80vh] w-fit h-full"
              />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </aside>
  )
}
