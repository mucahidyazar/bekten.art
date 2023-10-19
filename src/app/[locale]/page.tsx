import {ArtImage} from '@/components'
import {HomeSwiper} from '@/components/organisms/HomeSwiper'
import {prepareMetadata} from '@/utils'

export function generateMetadata() {
  const title =
    '🎨 Bekten Usubaliev - Master Kyrgyz Painter Unveiling Human Emotions'
  const description =
    '🎨 Discover the artistic world of Bekten Usubaliev, a renowned Kyrgyz painter known for his unique ability to unveil the hidden emotions and dreams encapsulated within the human spirit.'

  return prepareMetadata({
    title,
    description,
    page: title,
  })
}

export default function Home() {
  return (
    <div id="home" className="flex flex-col gap-8 w-full">
      <HomeSwiper />
      <aside className="w-full">
        <h3 className="text-2xl font-semibold mb-2">On Sale</h3>
        <div className="flex gap-2 w-full">
          <ArtImage
            src="/usubaliev_2.jpg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="h-60 w-40 min-w-[10rem] rounded-lg"
            imageClassName="object-cover h-full group-hover:scale-125 duration-500"
          />
          <ArtImage
            src="/usubaliev_2.jpg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="h-60 w-40 min-w-[10rem] rounded-lg"
            imageClassName="object-cover h-full group-hover:scale-125 duration-500"
          />
          <ArtImage
            src="/usubaliev_2.jpg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="h-60 w-40 min-w-[10rem] rounded-lg"
            imageClassName="object-cover h-full group-hover:scale-125 duration-500"
          />
        </div>
      </aside>
      <aside className="w-full">
        <h3 className="text-2xl font-semibold mb-2">Workshop</h3>
        <div className="flex gap-2 w-full overflow-auto">
          <ArtImage
            src="/img/workshop/workshop-0.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="h-60 w-40 min-w-[10rem] rounded-lg"
            imageClassName="object-cover h-full group-hover:scale-125 duration-500"
          />
          <ArtImage
            src="/img/workshop/workshop-1.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="h-60 w-40 min-w-[10rem] rounded-lg"
            imageClassName="object-cover h-full group-hover:scale-125 duration-500"
          />
          <ArtImage
            src="/img/workshop/workshop-2.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="h-60 w-40 min-w-[10rem] rounded-lg"
            imageClassName="object-cover h-full group-hover:scale-125 duration-500"
          />
          <ArtImage
            src="/img/workshop/workshop-3.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="h-60 w-40 min-w-[10rem] rounded-lg"
            imageClassName="object-cover h-full group-hover:scale-125 duration-500"
          />
          <ArtImage
            src="/img/workshop/workshop-4.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="h-60 w-40 min-w-[10rem] rounded-lg"
            imageClassName="object-cover h-full group-hover:scale-125 duration-500"
          />
        </div>
      </aside>
    </div>
  )
}
