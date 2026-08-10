import {Metadata} from 'next'

import Link from 'next/link'

import {
  ArrowRightIcon,
  HeartIcon,
  PaletteIcon,
  SparklesIcon,
} from 'lucide-react'
import {getTranslations} from 'next-intl/server'

import {CallToAction} from '@/components/molecules/call-to-action'
import {HeroVideo} from '@/components/molecules/hero-video'
import {TestimonialsSection} from '@/components/molecules/testimonials-section'
import {ArtistSection} from '@/components/sections/artist-section'
import {MemoriesSection} from '@/components/sections/memories-section'
import {WorkshopSection} from '@/components/sections/workshop-section'
import {Badge} from '@/components/ui/badge'
import {buttonVariants} from '@/components/ui/button'
import {localizedPath} from '@/lib/localized-path'
import {getHomepageContent} from '@/services'
import {cn} from '@/utils'
import {prepareMetadata} from '@/utils/prepare-metadata'

import type {AppLocale} from '@/lib/localized-path'

type PageProps = Readonly<{params: Promise<{locale: AppLocale}>}>

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'homepage'})

  return prepareMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

export default async function Home({params}: PageProps) {
  const {locale} = await params
  const [t, content] = await Promise.all([
    getTranslations({locale, namespace: 'homepage'}),
    getHomepageContent(locale),
  ])

  return (
    <div id="home" className="w-full pt-8">
      {/* Creative Artist Hero Section */}
      <section
        aria-labelledby="home-hero-heading"
        className="relative overflow-hidden pt-10 pb-40"
      >
        {/* Artistic Background Elements */}
        <div aria-hidden="true" className="absolute inset-0">
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
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

        <div className="app-container relative py-20">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Artist Introduction */}
            <div className="animate-fade-in-up space-y-8">
              <div className="space-y-6">
                <div className="animate-fade-in-up animation-delay-200">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 animate-pulse-gentle w-fit"
                  >
                    <SparklesIcon aria-hidden="true" className="mr-2 h-3 w-3" />
                    {t('heroTitle')}
                  </Badge>
                </div>

                <div className="animate-fade-in-up animation-delay-400">
                  <h1
                    id="home-hero-heading"
                    className="text-6xl leading-none font-bold lg:text-8xl"
                  >
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
                    {t('heroSubtitle')}
                  </p>
                  <p className="text-muted-foreground animate-fade-in animation-delay-800 mt-4 text-lg">
                    {t('heroDescription')}
                  </p>
                </div>
              </div>

              <div className="animate-fade-in-up animation-delay-1000 flex flex-wrap gap-4">
                <Link
                  href={localizedPath(locale, '/gallery')}
                  className={cn(
                    buttonVariants({size: 'lg'}),
                    'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/25 group shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-xl',
                  )}
                >
                  <PaletteIcon
                    aria-hidden="true"
                    className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12"
                  />
                  {t('heroButton1')}
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href={localizedPath(locale, '/about')}
                  className={cn(
                    buttonVariants({variant: 'outline', size: 'lg'}),
                    'border-primary/30 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground group transition-all duration-500 hover:scale-105',
                  )}
                >
                  <HeartIcon
                    aria-hidden="true"
                    className="mr-2 h-4 w-4 transition-transform group-hover:scale-110"
                  />
                  {t('heroButton2')}
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
        <div
          aria-hidden="true"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce"
        >
          <div className="border-primary/40 relative flex h-12 w-8 justify-center rounded-full border-2">
            <div className="from-primary/60 to-primary/20 mt-2 h-4 w-1.5 animate-pulse rounded-full bg-gradient-to-b" />
            <PaletteIcon className="text-primary/30 animate-spin-slow absolute -top-1 -right-1 h-3 w-3" />
          </div>
        </div>
      </section>

      <CallToAction />

      {/* Workshop Showcase Section */}
      <WorkshopSection items={content.workshopItems} locale={locale} />

      {/* Artist Section */}
      <ArtistSection items={content.artistStats} locale={locale} />

      {/* Testimonials Section */}
      <TestimonialsSection items={content.testimonials} />

      {/* Memories in Paint Section */}
      <MemoriesSection items={content.memories} locale={locale} />
    </div>
  )
}
