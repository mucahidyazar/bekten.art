import {
  PaletteIcon,
  AwardIcon,
  GraduationCapIcon,
  HeartIcon,
} from 'lucide-react'
import Image from 'next/image'
import {useTranslations} from 'next-intl'

import {ArtistHero} from '@/components/molecules/ArtistHero'
import {CallToAction} from '@/components/molecules/CallToAction'
import {SectionHeader} from '@/components/molecules/SectionHeader'
import {prepareMetadata} from '@/utils/prepareMetadata'

export async function generateMetadata() {
  const title = '🎨 About Bekten Usubaliev - Kyrgyz Painter & Art Lecturer'
  const description =
    "🎨 Learn about Bekten Usubaliev's artistic journey, his philosophy, and his contributions to art. A painter who believes in the power of art to unveil the hidden realms of human emotions and dreams."

  return await prepareMetadata({
    title,
    description,
    page: 'about',
  })
}

export default function AboutPage() {
  const t = useTranslations()

  return (
    <div id="about" className="container">
      {/* Hero Section */}
      <ArtistHero />

      {/* Biography Section */}
      <div className="space-y-12">
        <SectionHeader
          badgeText="Biography"
          badgeIcon="heart"
          title="My Journey"
          description="Discover the path that led me to become the artist I am today"
        />

        <div className="grid gap-8 md:grid-cols-3">
          {/* Biography Text */}
          <div className="space-y-6 md:col-span-2">
            <div className="prose prose-lg max-w-none">
              <div className="bg-card border-ring/20 space-y-4 rounded-xl border p-6">
                <p className="text-foreground leading-relaxed">
                  {t('biography1')}
                </p>
                <p className="text-foreground leading-relaxed">
                  {t('biography2')}
                </p>
                <p className="text-foreground leading-relaxed">
                  {t('biography3')}
                </p>
              </div>
            </div>
          </div>

          {/* Stats/Achievements */}
          <div className="space-y-6">
            <div className="bg-card border-ring/20 rounded-xl border p-6">
              <h3 className="text-foreground mb-4 flex items-center text-xl font-semibold">
                <AwardIcon className="text-primary mr-2 h-5 w-5" />
                Achievements
              </h3>
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-primary text-2xl font-bold">25+</div>
                  <div className="text-muted-foreground text-sm">
                    Years of Experience
                  </div>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-primary text-2xl font-bold">100+</div>
                  <div className="text-muted-foreground text-sm">
                    Artworks Created
                  </div>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-primary text-2xl font-bold">50+</div>
                  <div className="text-muted-foreground text-sm">
                    Exhibitions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Artwork */}
      <div className="mt-16 space-y-8">
        <SectionHeader
          badgeText="Masterpiece"
          badgeIcon="palette"
          title="Featured Work"
          description="One of my most celebrated pieces, showcasing the depth of human emotion through color and form"
        />

        <div className="bg-card border-ring/20 relative rounded-2xl border p-6">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="order-2 space-y-4 md:order-1">
              <h3 className="text-foreground text-2xl font-bold">
                &ldquo;TRAVELLING&rdquo;
              </h3>
              <div className="text-muted-foreground space-y-2 text-sm">
                <p>
                  <strong className="text-foreground">Medium:</strong> Canvas,
                  Oil
                </p>
                <p>
                  <strong className="text-foreground">Dimensions:</strong> 70x85
                  cm
                </p>
                <p>
                  <strong className="text-foreground">Year:</strong> 2001
                </p>
              </div>
              <p className="text-foreground leading-relaxed">
                This piece represents the journey of life, where each
                brushstroke tells a story of movement, growth, and the eternal
                quest for meaning. The interplay of colors captures the essence
                of wandering through both physical and emotional landscapes.
              </p>
            </div>

            <div className="order-1 md:order-2">
              <div className="group relative">
                <div className="from-primary-500 to-primary-700 absolute -inset-2 rounded-xl bg-gradient-to-r opacity-30 transition-opacity group-hover:opacity-50" />
                <Image
                  src="/img/workshop/workshop-0.jpeg"
                  alt="'TRAVELLING' Canvas, oil, 70x85 cm, 2001"
                  width={400}
                  height={400}
                  className="relative h-auto w-full rounded-lg object-cover shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="from-primary/5 mt-16 rounded-3xl bg-gradient-to-br to-transparent p-8 md:p-12">
        <SectionHeader
          badgeText="Philosophy"
          badgeIcon="graduation"
          title="Artistic Philosophy"
          description="My beliefs and approach to creating meaningful art"
          className="mb-6"
        />
        <div className="space-y-6 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="text-foreground text-lg leading-relaxed">
              Art is not merely about creating beautiful images; it&apos;s about
              revealing the invisible threads that connect human experiences.
              Through my work, I strive to capture the essence of emotions that
              often remain unspoken, transforming them into visual narratives
              that resonate with the soul.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="space-y-3 text-center">
              <div className="bg-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <HeartIcon className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-foreground font-semibold">Emotion</h3>
              <p className="text-muted-foreground text-sm">
                Every brushstroke carries the weight of human feeling
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="bg-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <PaletteIcon className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-foreground font-semibold">Technique</h3>
              <p className="text-muted-foreground text-sm">
                Mastering traditional methods while embracing innovation
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="bg-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <GraduationCapIcon className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-foreground font-semibold">Teaching</h3>
              <p className="text-muted-foreground text-sm">
                Sharing knowledge and inspiring the next generation of artists
              </p>
            </div>
          </div>
        </div>
      </div>

      <CallToAction
        title="Let's Connect"
        description="Ready to discuss art, commission a piece, or simply share your thoughts? I'd love to hear from you and explore how we can bring your artistic vision to life."
        primaryButtonText="Get in Touch"
        primaryButtonHref="/contact"
        secondaryButtonText="View Gallery"
        secondaryButtonHref="/gallery"
        iconName="mail"
      />
    </div>
  )
}
