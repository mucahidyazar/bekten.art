import {HomeSection} from '@/components/organisms'
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

const workshopData = [
  {
    url: '/img/workshop/workshop-0.jpeg',
    title: 'Broad Workshop View',
    description:
      "The heart of Bekten Usubaliev's artistic journey, this workshop is a place where creativity and imagination know no bounds. Various artworks, stretching from walls to the floor, reflect the breadth of his artistic vision.",
  },
  {
    url: '/img/workshop/workshop-1.jpeg',
    title: 'Portraits and Other Paintings',
    description:
      "Brought to life by Bekten's delicate brush strokes, these portraits dive deep into the depths of the human soul with their rich details. Each painting tells a different story to its viewers.",
  },
  {
    url: '/img/workshop/workshop-2.jpeg',
    title: 'Painting Shelves',
    description:
      "These shelves house Bekten's completed and ongoing projects. Each painting represents a different phase of the artist's journey.",
  },
  {
    url: '/img/workshop/workshop-3.jpeg',
    title: "Bekten's Uncle",
    description:
      'In the portrait of his uncle, Bekten plays both the artist and the observer. This self-portrait reflects his dedication and passion for art.',
  },
  {
    url: '/img/workshop/workshop-4.jpeg',
    title: 'Workshop Entrance',
    description:
      "Bekten's workshop is the space where he practices his art and imparts it to his students. The workshop stands as the heart of Bekten's artistic journey.",
  },
]

const artworksData = [
  {
    url: '/img/art/art-0.png',
    title: 'Graceful Lady Portrait',
    description:
      "A captivating portrait capturing the essence of a lady's elegance and deep gaze. The detailed patterns and contrasting yellow dress exude a sense of grace and timelessness.",
  },
  {
    url: '/img/art/art-1.png',
    title: 'Dance of Unity',
    description:
      'A vibrant depiction of three figures in dance, symbolizing unity and joy. The use of geometrical patterns and bold colors brings this artwork to life, evoking a sense of movement and celebration.',
  },
  {
    url: '/img/art/art-2.png',
    title: 'Solitude with Nature',
    description:
      "A serene portrayal of a woman lost in her thoughts, with nature's abundance around her. The juxtaposition of the figure with flowers and fruits symbolizes harmony and contemplation.",
  },
  {
    url: '/img/art/art-3.png',
    title: 'Musician in Thought',
    description:
      'A deep portrayal of a musician immersed in his music, the artwork beautifully captures the emotion and passion of an artist for his craft. The splashes of colors in the background further accentuate the depth of his contemplation.',
  },
  {
    url: '/img/art/art-4.png',
    title: 'Elderly Gentleman Portrait',
    description:
      'A masterful portrait capturing the wisdom and dignity of an elderly gentleman. The subtle details, from the texture of the hat to the expression in his eyes, convey a lifetime of experiences and stories.',
  },
  {
    url: '/img/art/art-5.png',
    title: 'Lady of the Twilight',
    description:
      'An enchanting depiction of a solitary figure standing tall amidst geometric patterns. The use of contrasting colors and the silhouette of the lady create a mystic aura, symbolizing strength and grace.',
  },
  {
    url: '/img/art/art-6.png',
    title: 'Dancers in Harmony',
    description:
      'A dynamic portrayal of three dancers in synchrony, set against a backdrop of vibrant colors. The artwork exudes energy, movement, and the joy of unity in dance.',
  },
]

export default function Home() {
  return (
    <div id="home" className="flex flex-col gap-8 w-full">
      <HomeSwiper data={workshopData} />
      <HomeSection title="Memories" data={artworksData} />
      <HomeSection title="Workshop" data={workshopData} />
    </div>
  )
}
