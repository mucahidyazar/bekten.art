'use client'
import {useState} from 'react'
import {Lightbox} from 'react-modal-image'

import {ArtImage} from '../molecules'

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

  const handleClose = () => {
    setImage(null)
  }
  return (
    <aside className="w-full">
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <div className="flex gap-2 w-full overflow-auto">
        {data.map(item => (
          <ArtImage
            key={item.url}
            src={item.url}
            description={item.title}
            className="h-60 w-40 min-w-[10rem] rounded-lg"
            imageClassName="object-cover h-full group-hover:scale-125 duration-500"
            onClick={() => setImage(item)}
          />
        ))}
      </div>
      {image && (
        <Lightbox
          small={image.url}
          large={image.url}
          {...(handleClose ? {onClose: handleClose} : {})}
          hideZoom={true}
          alt={
            (
              <div>
                <p className="mb-2">{image.title}</p>
                <p className="text-sm">{image.description}</p>
              </div>
            ) as any
          }
        />
      )}
    </aside>
  )
}
