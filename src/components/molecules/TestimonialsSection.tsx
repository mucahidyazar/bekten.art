'use client'

import {ChevronLeftIcon, ChevronRightIcon, QuoteIcon} from 'lucide-react'
import Image from 'next/image'
import {useTranslations} from 'next-intl'
import {useState, useEffect} from 'react'

import {SectionHeader} from '@/components/molecules/SectionHeader'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {testimonialsData} from '@/mocks/testimonials'


const categoryColors = {
  artist:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  businessman:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  politician:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  collector:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  critic: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
}

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const t = useTranslations('testimonials')

  const categoryLabels = {
    artist: t('categoryArtist'),
    businessman: t('categoryBusinessman'),
    politician: t('categoryPolitician'),
    collector: t('categoryCollector'),
    critic: t('categoryCritic'),
  }

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % testimonialsData.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextTestimonial = () => {
    setCurrentIndex(prev => (prev + 1) % testimonialsData.length)
    setIsAutoPlaying(false)
  }

  const prevTestimonial = () => {
    setCurrentIndex(
      prev => (prev - 1 + testimonialsData.length) % testimonialsData.length,
    )
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  const currentTestimonial = testimonialsData[currentIndex]

  return (
    <section className="from-background via-muted/20 to-background bg-gradient-to-br py-20">
      <div className="container lg:px-0">
        <SectionHeader
          badgeText={t('badgeText')}
          badgeIcon="heart"
          title={t('title')}
          description={t('description')}
          className="mb-16"
        />

        {/* Main Testimonial Display */}
        <div className="relative mx-auto max-w-6xl">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="bg-primary/5 absolute top-10 left-10 h-20 w-20 animate-pulse rounded-full blur-xl" />
            <div className="bg-primary/3 absolute right-10 bottom-10 h-32 w-32 animate-pulse rounded-full blur-2xl delay-1000" />
            <QuoteIcon className="text-primary/5 absolute top-0 left-0 h-24 w-24 -rotate-12 transform" />
            <QuoteIcon className="text-primary/5 absolute right-0 bottom-0 h-32 w-32 scale-x-[-1] rotate-12 transform" />
          </div>

          <Card className="bg-card/80 border-border/50 relative overflow-hidden shadow-2xl backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-2">
                {/* Testimonial Content */}
                <div className="relative flex flex-col justify-center p-8 lg:p-12">
                  {/* Quote Icon */}
                  <QuoteIcon className="text-primary/20 mb-6 h-12 w-12" />

                  {/* Category Badge */}
                  <Badge
                    variant="secondary"
                    className={`mb-6 w-fit ${categoryColors[currentTestimonial.category]}`}
                  >
                    {categoryLabels[currentTestimonial.category]}
                  </Badge>

                  {/* Quote */}
                  <blockquote className="text-foreground/90 mb-8 text-lg leading-relaxed font-medium italic lg:text-xl">
                    "{currentTestimonial.quote}"
                  </blockquote>

                  {/* Author Info */}
                  <div className="space-y-2">
                    <h3 className="text-foreground text-xl font-bold">
                      {currentTestimonial.name}
                    </h3>
                    <p className="text-primary font-medium">
                      {currentTestimonial.title}
                    </p>
                    {currentTestimonial.company && (
                      <p className="text-muted-foreground">
                        {currentTestimonial.company}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm">
                      📍 {currentTestimonial.location}
                    </p>
                  </div>
                </div>

                {/* Author Image - Modern Design */}
                <div className="from-primary/5 to-primary/10 relative flex items-center justify-center bg-gradient-to-br via-transparent p-8">
                  {/* Background Decorative Elements */}
                  <div className="absolute inset-0 overflow-hidden rounded-r-2xl">
                    {/* Floating Orbs */}
                    <div className="bg-primary/10 absolute top-1/4 right-1/4 h-32 w-32 animate-pulse rounded-full blur-2xl"></div>
                    <div className="bg-secondary/15 absolute bottom-1/3 left-1/3 h-24 w-24 animate-pulse rounded-full blur-xl delay-1000"></div>

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
                        {Array.from({length: 64}).map((_, i) => (
                          <div
                            key={i}
                            className="border-primary/20 border"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main Avatar Container */}
                  <div className="group relative">
                    {/* Outer Glow Ring */}
                    <div className="from-primary/20 via-secondary/20 to-primary/20 absolute -inset-4 rounded-full bg-gradient-to-r opacity-60 blur-lg transition-opacity duration-500 group-hover:opacity-100"></div>

                    {/* Rotating Border */}
                    <div className="from-primary via-secondary to-primary animate-spin-slow absolute -inset-2 rounded-full bg-gradient-to-r opacity-75">
                      <div className="bg-background h-full w-full scale-[0.95] rounded-full"></div>
                    </div>

                    {/* Avatar Frame */}
                    <div className="relative h-64 w-64 lg:h-72 lg:w-72">
                      {/* Glass Morphism Background */}
                      <div className="bg-background/80 absolute inset-0 rounded-full border border-white/20 shadow-2xl backdrop-blur-xl"></div>

                      {/* Avatar Image */}
                      <div className="ring-primary/30 ring-offset-background absolute inset-2 overflow-hidden rounded-full ring-2 ring-offset-2">
                        <Image
                          src={currentTestimonial.avatar}
                          alt={currentTestimonial.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 240px, 280px"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                      </div>

                      {/* Floating Info Card */}
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 translate-y-2 transform transition-transform duration-500 group-hover:translate-y-0">
                        <div className="bg-background/95 border-border/50 min-w-max rounded-2xl border px-6 py-3 shadow-xl backdrop-blur-md">
                          <div className="space-y-1 text-center">
                            <h4 className="text-foreground text-sm font-semibold">
                              {currentTestimonial.name}
                            </h4>
                            <p className="text-muted-foreground text-xs">
                              {currentTestimonial.title}
                            </p>
                            <div className="flex items-center justify-center gap-1 pt-1">
                              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
                              <span className="text-muted-foreground text-xs">
                                {currentTestimonial.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Achievement Badge */}
                      <div className="absolute -top-2 -right-2">
                        <div className="border-background flex h-12 w-12 items-center justify-center rounded-full border-2 bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                          <span className="text-lg text-white">✨</span>
                        </div>
                      </div>

                      {/* Category Indicator */}
                      <div className="absolute -top-2 -left-2">
                        <div
                          className={`border-background flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-md ${categoryColors[currentTestimonial.category]}`}
                        >
                          <span className="text-xs font-bold">
                            {currentTestimonial.category === 'artist'
                              ? '🎨'
                              : currentTestimonial.category === 'businessman'
                                ? '💼'
                                : currentTestimonial.category === 'politician'
                                  ? '🏛️'
                                  : currentTestimonial.category === 'collector'
                                    ? '🖼️'
                                    : '📚'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modern Navigation */}
          <div className="mt-12 flex items-center justify-center gap-6">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="group border-primary/20 bg-background/80 hover:border-primary relative h-14 w-14 rounded-full border-2 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-xl"
            >
              <div className="from-primary/20 to-secondary/20 absolute inset-0 rounded-full bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <ChevronLeftIcon className="text-primary relative h-6 w-6 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </Button>

            {/* Enhanced Dots Indicator */}
            <div className="bg-background/80 border-border/30 flex items-center gap-3 rounded-full border px-6 py-3 shadow-lg backdrop-blur-md">
              {testimonialsData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`relative transition-all duration-500 ${
                    index === currentIndex
                      ? 'h-3 w-8'
                      : 'h-3 w-3 hover:scale-125'
                  }`}
                >
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-500 ${
                      index === currentIndex
                        ? 'from-primary to-secondary bg-gradient-to-r shadow-lg'
                        : 'bg-primary/30 hover:bg-primary/60'
                    }`}
                  ></div>
                  {index === currentIndex && (
                    <div className="from-primary to-secondary absolute inset-0 animate-pulse rounded-full bg-gradient-to-r"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="group border-primary/20 bg-background/80 hover:border-primary relative h-14 w-14 rounded-full border-2 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-xl"
            >
              <div className="from-primary/20 to-secondary/20 absolute inset-0 rounded-full bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <ChevronRightIcon className="text-primary relative h-6 w-6 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
          </div>

          {/* Modern Auto-play Control */}
          <div className="mt-6 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="group bg-background/60 border-border/30 hover:bg-background/80 hover:border-primary/30 relative rounded-full border px-6 py-2 text-xs font-medium backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    isAutoPlaying ? 'animate-pulse bg-green-400' : 'bg-gray-400'
                  }`}
                ></div>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {isAutoPlaying ? t('autoPlaying') : t('manualControl')}
                </span>
                <div className="text-primary/60 ml-1">
                  {isAutoPlaying ? '⏸️' : '▶️'}
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
