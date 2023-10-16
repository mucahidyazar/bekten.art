'use client'
import Image from 'next/image'
import {useState} from 'react'

export default function HomeTemplate() {
  const [selectedImage, setSelectedImage] = useState<null | string>(null)

  return (
    <div>
      <aside className="mb-20">
        <div className="mx-auto w-fit relative">
          <Image
            src="/easel.png"
            alt="Easel"
            width={400}
            height={400}
            className="h-96 w-auto"
          />

          {selectedImage && (
            <Image
              src={selectedImage}
              alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
              width={400}
              height={400}
              className="h-80 w-fit absolute bottom-[178px] left-0 object-cover saturate-0 duration-150"
            />
          )}
        </div>
      </aside>
      <aside>
        <h3 className="text-2xl font-semibold mb-2">On Sale</h3>
        <div>
          <div
            className="w-60 relative group"
            onMouseEnter={() => {
              setSelectedImage('/usubaliev_1.jpg')
            }}
          >
            <Image
              src="/usubaliev_2.jpg"
              alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
              width={400}
              height={400}
              className="h-80 w-full object-cover saturate-0 group-hover:saturate-100 duration-150"
            />
            <p className="absolute bottom-0 left-0 text-xs text-white z-20 p-2">
              `TRAVELLING` Canvas, oil, 70x85 cm, 2001
            </p>
            <div className="absolute bottom-0 right-0 left-0 h-16 bg-gradient-to-t from-black to-transparent z-10" />
          </div>
        </div>
      </aside>
    </div>
  )
}
