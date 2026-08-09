'use client'

import Image from 'next/image'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  PauseIcon,
  PlayIcon,
  QuoteIcon,
  UserRoundIcon,
} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useEffect, useState} from 'react'

import {SectionHeader} from '@/components/molecules/section-header'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'

import type {Testimonial} from '@/server/content/domain'

type TestimonialsSectionProps = Readonly<{
  items: Testimonial[]
}>

const categoryKeys = {
  ARTIST: 'categoryArtist',
  BUSINESSPERSON: 'categoryBusinessman',
  COLLECTOR: 'categoryCollector',
  CRITIC: 'categoryCritic',
  CURATOR: 'categoryCurator',
  JOURNALIST: 'categoryJournalist',
  POLITICIAN: 'categoryPolitician',
} as const

export function TestimonialsSection({items}: TestimonialsSectionProps) {
  const t = useTranslations('testimonials')
  const common = useTranslations('common')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stopForReducedMotion = () => {
      if (mediaQuery.matches) setIsAutoPlaying(false)
    }
    const stopWhenHidden = () => {
      if (document.hidden) setIsAutoPlaying(false)
    }

    stopForReducedMotion()
    mediaQuery.addEventListener('change', stopForReducedMotion)
    document.addEventListener('visibilitychange', stopWhenHidden)

    return () => {
      mediaQuery.removeEventListener('change', stopForReducedMotion)
      document.removeEventListener('visibilitychange', stopWhenHidden)
    }
  }, [])

  useEffect(() => {
    if (!isAutoPlaying || items.length < 2) return

    const interval = window.setInterval(() => {
      setCurrentIndex(previous => (previous + 1) % items.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [isAutoPlaying, items.length])

  if (items.length === 0) return null

  const current = items[currentIndex] ?? items[0]
  const previousLabel = `${common('previous')} ${t('title')}`
  const nextLabel = `${common('next')} ${t('title')}`

  const showPrevious = () => {
    setCurrentIndex(previous => (previous - 1 + items.length) % items.length)
    setIsAutoPlaying(false)
  }
  const showNext = () => {
    setCurrentIndex(previous => (previous + 1) % items.length)
    setIsAutoPlaying(false)
  }

  return (
    <section
      aria-label={t('title')}
      aria-roledescription="carousel"
      className="from-background via-muted/20 to-background bg-gradient-to-br py-24"
    >
      <div className="app-container lg:px-0">
        <SectionHeader
          badgeText={t('badgeText')}
          badgeIcon="heart"
          title={t('title')}
          description={t('description')}
        />

        <div
          className="app-container relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onFocusCapture={() => setIsAutoPlaying(false)}
        >
          <Card className="bg-card/80 border-border/50 overflow-hidden shadow-2xl backdrop-blur-sm">
            <CardContent className="p-0">
              <div
                role="group"
                aria-roledescription="slide"
                aria-label={`${currentIndex + 1} / ${items.length}`}
                aria-live={isAutoPlaying ? 'off' : 'polite'}
                className="grid min-h-[28rem] lg:grid-cols-2"
              >
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  <QuoteIcon
                    aria-hidden="true"
                    className="text-primary/30 mb-6 h-12 w-12"
                  />
                  <Badge variant="secondary" className="mb-6 w-fit">
                    {t(categoryKeys[current.category])}
                  </Badge>
                  <blockquote className="text-foreground/90 mb-8 text-xl leading-relaxed font-medium italic">
                    “{current.quote}”
                  </blockquote>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">{current.name}</p>
                    <p className="text-primary font-medium">{current.title}</p>
                    {current.company ? (
                      <p className="text-muted-foreground">
                        {current.company}
                      </p>
                    ) : null}
                    {current.location ? (
                      <p className="text-muted-foreground text-sm">
                        {current.location}
                      </p>
                    ) : null}
                    {current.sourceUrl ? (
                      <a
                        href={current.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary mt-4 inline-flex items-center gap-2 text-sm font-medium"
                      >
                        <ExternalLinkIcon
                          aria-hidden="true"
                          className="h-4 w-4"
                        />
                        {common('view')}
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="from-primary/5 to-primary/15 relative flex items-center justify-center bg-gradient-to-br p-10">
                  <div className="bg-background ring-primary/20 relative h-64 w-64 overflow-hidden rounded-full shadow-2xl ring-8">
                    {current.avatarUrl ? (
                      <Image
                        src={current.avatarUrl}
                        alt={current.avatarAlt ?? current.name}
                        fill
                        sizes="256px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-full items-center justify-center">
                        <UserRoundIcon
                          aria-hidden="true"
                          className="text-muted-foreground h-20 w-20"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {items.length > 1 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={previousLabel}
                onClick={showPrevious}
              >
                <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
              </Button>

              <div role="group" aria-label={t('title')} className="flex gap-2">
                {items.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-label={t('showTestimonial', {index: index + 1})}
                    aria-current={index === currentIndex ? 'true' : undefined}
                    onClick={() => {
                      setCurrentIndex(index)
                      setIsAutoPlaying(false)
                    }}
                    className={`h-3 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-primary w-8'
                        : 'bg-primary/30 w-3'
                    }`}
                  />
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={nextLabel}
                onClick={showNext}
              >
                <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                aria-label={
                  isAutoPlaying ? t('pauseAutoplay') : t('startAutoplay')
                }
                aria-pressed={isAutoPlaying}
                onClick={() => setIsAutoPlaying(previous => !previous)}
              >
                {isAutoPlaying ? (
                  <PauseIcon aria-hidden="true" className="mr-2 h-4 w-4" />
                ) : (
                  <PlayIcon aria-hidden="true" className="mr-2 h-4 w-4" />
                )}
                {isAutoPlaying ? t('pauseAutoplay') : t('startAutoplay')}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
