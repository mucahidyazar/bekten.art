import {Metadata} from 'next'

import Image from 'next/image'

import {
  AwardIcon,
  GraduationCapIcon,
  HeartIcon,
  PaletteIcon,
} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {ArtistHero} from '@/components/molecules/artist-hero'
import {CallToAction} from '@/components/molecules/call-to-action'
import {SectionHeader} from '@/components/molecules/section-header'
import {prepareMetadata} from '@/utils/prepare-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const {getTranslations} = await import('next-intl/server')
  const t = await getTranslations('about')

  return prepareMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
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
          badgeText={t('about.biography')}
          badgeIcon="heart"
          title={t('about.myJourney')}
          description={t('about.journeyDescription')}
        />

        <div className="grid gap-8 md:grid-cols-3">
          {/* Biography Text */}
          <div className="space-y-6 md:col-span-2">
            <div className="prose prose-lg max-w-none">
              <div className="bg-card border-ring/20 space-y-4 rounded-xl border p-6">
                <p className="text-foreground leading-relaxed">
                  {t('about.biographyEducation')}
                </p>
                <p className="text-foreground leading-relaxed">
                  {t('about.biographyExhibitions')}
                </p>
                <p className="text-foreground leading-relaxed">
                  {t('about.biographyCollections')}
                </p>
              </div>
            </div>
          </div>

          {/* Stats/Achievements */}
          <div className="space-y-6">
            <div className="bg-card border-ring/20 rounded-xl border p-6">
              <h3 className="text-foreground mb-4 flex items-center text-xl font-semibold">
                <AwardIcon className="text-primary mr-2 h-5 w-5" />
                {t('about.achievements')}
              </h3>
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-primary text-2xl font-bold">25+</div>
                  <div className="text-muted-foreground text-sm">
                    {t('about.yearsOfExperience')}
                  </div>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-primary text-2xl font-bold">100+</div>
                  <div className="text-muted-foreground text-sm">
                    {t('about.artworksCreated')}
                  </div>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-primary text-2xl font-bold">50+</div>
                  <div className="text-muted-foreground text-sm">
                    {t('about.exhibitions')}
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
          badgeText={t('about.masterpiece')}
          badgeIcon="palette"
          title={t('about.featuredWork')}
          description={t('about.featuredWorkDescription')}
        />

        <div className="bg-card border-ring/20 relative rounded-2xl border p-6">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="order-2 space-y-4 md:order-1">
              <h3 className="text-foreground text-2xl font-bold">
                &ldquo;TRAVELLING&rdquo;
              </h3>
              <div className="text-muted-foreground space-y-2 text-sm">
                <p>
                  <strong className="text-foreground">
                    {t('about.medium')}:
                  </strong>{' '}
                  Canvas, Oil
                </p>
                <p>
                  <strong className="text-foreground">
                    {t('about.dimensions')}:
                  </strong>{' '}
                  70x85 cm
                </p>
                <p>
                  <strong className="text-foreground">
                    {t('about.year')}:
                  </strong>{' '}
                  2001
                </p>
              </div>
              <p className="text-foreground leading-relaxed">
                {t('about.artworkDescription')}
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
          badgeText={t('about.philosophy')}
          badgeIcon="graduation"
          title={t('about.artisticPhilosophy')}
          description={t('about.philosophyDescription')}
          className="mb-6"
        />
        <div className="space-y-6 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="text-foreground text-lg leading-relaxed">
              {t('about.philosophyText')}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="space-y-3 text-center">
              <div className="bg-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <HeartIcon className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-foreground font-semibold">
                {t('about.emotion')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('about.emotionDescription')}
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="bg-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <PaletteIcon className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-foreground font-semibold">
                {t('about.technique')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('about.techniqueDescription')}
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="bg-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <GraduationCapIcon className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-foreground font-semibold">
                {t('about.teaching')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('about.teachingDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CallToAction
        title={t('about.letsConnect')}
        description={t('about.connectDescription')}
        primaryButtonText={t('about.getInTouch')}
        primaryButtonHref="/contact"
        secondaryButtonText={t('about.viewGallery')}
        secondaryButtonHref="/gallery"
        iconName="mail"
      />
    </div>
  )
}
