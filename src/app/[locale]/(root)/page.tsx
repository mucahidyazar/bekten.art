import {
  ArrowRightIcon,
  SparklesIcon,
  PaletteIcon,
  HeartIcon,
} from 'lucide-react'
import Link from 'next/link'

import {ArtworkCard} from '@/components/molecules/ArtworkCard'
import {CallToAction} from '@/components/molecules/CallToAction'
import {HeroVideo} from '@/components/molecules/HeroVideo'
import {SectionHeader} from '@/components/molecules/SectionHeader'
import {TestimonialsSection} from '@/components/molecules/TestimonialsSection'
import {HomeSection} from '@/components/organisms/HomeSection'
import {HomeSwiper} from '@/components/organisms/HomeSwiper'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {prepareMetadata} from '@/utils/prepareMetadata'

export async function generateMetadata() {
  const title =
    '🎨 Bekten Usubaliev - Master Kyrgyz Painter Unveiling Human Emotions'
  const description =
    '🎨 Discover the artistic world of Bekten Usubaliev, a renowned Kyrgyz painter known for his unique ability to unveil the hidden emotions and dreams encapsulated within the human spirit.'

  return await prepareMetadata({
    title,
    description,
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

export default async function Home() {
  // TODO: Replace with Supabase query
  const onSaleArtworks: any[] = []

  return (
    <div id="home" className="w-full pt-8">
      {/* Creative Artist Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-40">
        {/* Artistic Background Elements */}
        <div className="absolute inset-0">
          {/* Paint Splashes */}
          <div className="bg-primary/20 animate-float absolute top-20 left-20 h-4 w-4 rounded-full blur-sm" />
          <div className="bg-primary/15 animate-float-delayed absolute top-40 right-32 h-6 w-6 rounded-full blur-md" />
          <div className="bg-primary/25 animate-float-slow absolute bottom-40 left-1/3 h-3 w-3 rounded-full blur-sm" />
          <div className="bg-primary/10 animate-float absolute top-1/2 right-1/4 h-5 w-5 rounded-full blur-lg" />

          {/* Brush Strokes */}
          <div className="from-primary/20 animate-brush-stroke absolute top-32 left-1/4 h-1 w-20 rotate-12 bg-gradient-to-r to-transparent" />
          <div className="from-primary/15 animate-brush-stroke animation-delay-400 absolute right-1/3 bottom-32 h-1 w-16 -rotate-12 bg-gradient-to-l to-transparent" />
          <div className="from-primary/10 animate-brush-stroke animation-delay-800 absolute top-2/3 left-10 h-1 w-12 rotate-45 bg-gradient-to-r to-transparent" />

          {/* Canvas Texture */}
          <div className="bg-canvas-texture absolute inset-0 opacity-5" />
        </div>

        {/* Floating Art Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Palette */}
          <div className="animate-float-palette absolute top-1/4 left-16 h-8 w-8">
            <PaletteIcon className="text-primary/20 h-full w-full" />
          </div>

          {/* Brushes */}
          <div className="animate-float-brush absolute right-20 bottom-1/3 h-6 w-6 rotate-45">
            <div className="bg-primary/15 h-full w-full rounded-full" />
          </div>

          {/* Color Drops */}
          <div className="animate-color-drop absolute top-1/3 right-1/2 h-2 w-2 rounded-full bg-red-400/30" />
          <div className="animate-color-drop animation-delay-600 absolute top-1/2 left-1/3 h-2 w-2 rounded-full bg-blue-400/30" />
          <div className="animate-color-drop animation-delay-1200 absolute bottom-1/4 left-1/2 h-2 w-2 rounded-full bg-yellow-400/30" />
        </div>

        <div className="relative container py-20">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Artist Introduction */}
            <div className="animate-fade-in-up space-y-8">
              <div className="space-y-6">
                <div className="animate-fade-in-up animation-delay-200">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 animate-pulse-gentle w-fit"
                  >
                    <SparklesIcon className="mr-2 h-3 w-3" />
                    Contemporary Master
                  </Badge>
                </div>

                <div className="animate-fade-in-up animation-delay-400">
                  <h1 className="text-6xl leading-none font-bold lg:text-8xl">
                    <span className="from-foreground via-primary to-foreground/70 animate-gradient-slow block bg-gradient-to-r bg-clip-text text-transparent">
                      Bekten
                    </span>
                    <span className="from-primary via-foreground to-primary/70 animate-gradient-slow animation-delay-300 block bg-gradient-to-r bg-clip-text text-transparent">
                      Usubaliev
                    </span>
                  </h1>
                </div>

                <div className="animate-fade-in-up animation-delay-600">
                  <p className="text-2xl leading-relaxed font-light lg:text-3xl">
                    <span className="text-muted-foreground">Where</span>{' '}
                    <span className="text-primary animate-text-glow">soul</span>{' '}
                    <span className="text-muted-foreground">meets</span>{' '}
                    <span className="text-primary animate-text-glow animation-delay-200">
                      canvas
                    </span>
                  </p>
                  <p className="text-muted-foreground animate-fade-in animation-delay-800 mt-4 text-lg">
                    Creating timeless masterpieces that capture the essence of
                    human emotion
                  </p>
                </div>
              </div>

              <div className="animate-fade-in-up animation-delay-1000 flex flex-wrap gap-4">
                <Link href="/gallery">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/25 group shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-xl"
                  >
                    <PaletteIcon className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                    Discover Art
                    <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-primary/30 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground group transition-all duration-500 hover:scale-105"
                  >
                    <HeartIcon className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    Meet Artist
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Video */}
            <div className="animate-fade-in-right animation-delay-1200 relative lg:order-2">
              <HeroVideo />
            </div>
          </div>
        </div>

        {/* Artistic Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce">
          <div className="border-primary/40 relative flex h-12 w-8 justify-center rounded-full border-2">
            <div className="from-primary/60 to-primary/20 mt-2 h-4 w-1.5 animate-pulse rounded-full bg-gradient-to-b" />
            <PaletteIcon className="text-primary/30 animate-spin-slow absolute -top-1 -right-1 h-3 w-3" />
          </div>
        </div>
      </section>

      <CallToAction />

      {/* Workshop Showcase Section */}
      <section className="py-20">
        <div className="container lg:px-0">
          <SectionHeader
            badgeText="Behind the Art"
            badgeIcon="palette"
            title="The Creative Workshop"
            description="Step into the creative sanctuary where masterpieces come to life, where tradition meets innovation"
          />

          <div className="bg-card/50 border-border/50 relative rounded-3xl border p-6 shadow-2xl backdrop-blur-sm">
            <HomeSwiper data={workshopData} />
          </div>
        </div>
      </section>

      {/* About Artist Section with Stats */}
      <section className="py-20">
        <div className="container lg:px-0">
          <SectionHeader
            badgeText="Master Kyrgyz Artist"
            badgeIcon="heart"
            title="Bekten Usubaliev"
            description="Unveiling the hidden emotions and dreams within the human spirit through masterful brushstrokes"
            className="mb-16"
          />

          {/* Stats */}
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-card/50 border-border/30 rounded-2xl border p-8 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
              <div className="text-primary mb-2 text-4xl font-bold lg:text-5xl">
                50+
              </div>
              <div className="text-muted-foreground font-medium">
                Masterful Artworks
              </div>
              <div className="text-muted-foreground/70 mt-2 text-sm">
                Created with passion and precision
              </div>
            </div>
            <div className="bg-card/50 border-border/30 rounded-2xl border p-8 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
              <div className="text-primary mb-2 text-4xl font-bold lg:text-5xl">
                25+
              </div>
              <div className="text-muted-foreground font-medium">
                Years of Experience
              </div>
              <div className="text-muted-foreground/70 mt-2 text-sm">
                Dedicated to artistic excellence
              </div>
            </div>
            <div className="bg-card/50 border-border/30 rounded-2xl border p-8 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
              <div className="text-primary mb-2 text-4xl font-bold lg:text-5xl">
                100+
              </div>
              <div className="text-muted-foreground font-medium">
                Happy Collectors
              </div>
              <div className="text-muted-foreground/70 mt-2 text-sm">
                Worldwide art enthusiasts
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/gallery">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <PaletteIcon className="mr-2 h-4 w-4" />
                Explore Gallery
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="border-border/50 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <HeartIcon className="mr-2 h-4 w-4" />
                About Artist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Featured Artworks Section */}
      <section className="py-20">
        <div className="container lg:px-0">
          <SectionHeader
            badgeText="Featured Collection"
            badgeIcon="sparkles"
            title="Memories in Paint"
            description="Each artwork tells a unique story, capturing moments of human emotion and the beauty of Kyrgyz culture"
          />

          <HomeSection title="" data={artworksData} />
        </div>
      </section>

      {/* On Sale Artworks - if any */}
      {!!onSaleArtworks.length && (
        <section className="py-20">
          <div className="container lg:px-0">
            <SectionHeader
              badgeText="Limited Collection"
              badgeIcon="sparkles"
              title="Artworks on Sale"
              description="Exclusive opportunity to own an original Bekten Usubaliev masterpiece"
            />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {onSaleArtworks.map(item => (
                <ArtworkCard key={item.id} artwork={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
