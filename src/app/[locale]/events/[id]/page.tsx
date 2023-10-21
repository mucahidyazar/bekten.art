import Image from 'next/image'

import {prepareMetadata} from '@/utils/prepareMetadata'

export function generateMetadata() {
  const title = '🎨 Art Detail - Bekten Usubaliev’s `Haver` Masterpiece'
  const description =
    '🎨 Delve into `Haver`, a celebrated artwork by Bekten Usubaliev, encapsulating intricate layers of human emotions, dreams, and spirit. Explore the depths of artistic expression and the untold narratives of the soul.'

  return prepareMetadata({
    title,
    description,
    page: title,
  })
}

export default function Page() {
  return (
    <div id="home" className="flex flex-col gap-4">
      <div className="h-60">
        <Image
          src="/usubaliev_1.jpg"
          alt="Bekten Usubaliev"
          width={400}
          height={400}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <h3 className="font-semibold text-gray-500">
          Title of the Risen Event
        </h3>
        <div className="text-xs text-gray-500">
          {/* subtitle */}
          <p>1015 Chestnut St. Philadelphia, PA 19107</p>
          <p>Jun, 23 / 7:00 PM - 9:00 PM</p>
          <p>Free</p>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium
        voluptate alias quasi nemo, temporibus laborum reprehenderit similique.
        Ducimus explicabo obcaecati natus doloremque necessitatibus sit quis
        voluptate, harum, optio earum quisquam magnam vero cum tempore, eveniet
        sapiente. Eius quas mollitia quis ducimus soluta non quia. Illo
        voluptates, omnis qui aut consectetur ullam repellat pariatur nobis
        accusantium facilis quod illum nostrum iste quaerat vitae quam
        exercitationem rem veniam atque neque! Hic at omnis ut eaque pariatur
        voluptatum non doloribus praesentium id ullam voluptates, eum earum,
        laborum inventore, fugit deleniti? Voluptatem repellendus sed quaerat
        accusamus exercitationem nihil totam. Alias totam, excepturi libero
        provident doloribus culpa et quam cupiditate facilis aut sed nisi
        facere, non sapiente placeat mollitia atque asperiores eveniet magnam
        laborum tempora?
      </div>
    </div>
  )
}
