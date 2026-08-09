'use client'

import {PauseIcon, PlayIcon} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'
import {
  A11y,
  Autoplay,
  EffectFade,
  Navigation,
  Pagination,
  Scrollbar,
} from 'swiper/modules'
import {Swiper, SwiperSlide} from 'swiper/react'

import {ArtImage} from '@/components/molecules/art-image'

import type {Swiper as SwiperInstance} from 'swiper'

type SectionData = {
  url: string
  title: string
  description: string
}
type HomeSwiperProps = {
  data: SectionData[]
}
export function HomeSwiper({data}: HomeSwiperProps) {
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
      setIsAutoPlaying(!mediaQuery.matches && data.length > 1)
    }

    syncPreference()
    mediaQuery.addEventListener('change', syncPreference)

    return () => mediaQuery.removeEventListener('change', syncPreference)
  }, [data.length])

  useEffect(() => {
    if (!swiperRef.current) return

    if (isAutoPlaying) {
      swiperRef.current.autoplay.start()
    } else {
      swiperRef.current.autoplay.stop()
    }
  }, [isAutoPlaying])

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      swiperRef.current?.autoplay.stop()
      setIsAutoPlaying(false)
    } else {
      swiperRef.current?.autoplay.start()
      setIsAutoPlaying(true)
    }
  }

  return (
    <section
      className="relative w-full"
      aria-label="Featured artworks"
      aria-roledescription="carousel"
    >
      <Swiper
        slidesPerView={1}
        autoplay={
          isAutoPlaying && !prefersReducedMotion
            ? {
                delay: 5000,
                disableOnInteraction: true,
                pauseOnMouseEnter: true,
              }
            : false
        }
        loop={!prefersReducedMotion && data.length > 1}
        navigation
        effect="fade"
        pagination={{clickable: true}}
        scrollbar={{draggable: true}}
        onSwiper={swiper => {
          swiperRef.current = swiper
        }}
        a11y={{
          enabled: true,
          containerRoleDescriptionMessage: 'Artwork carousel',
          itemRoleDescriptionMessage: 'Artwork slide',
          nextSlideMessage: 'Next artwork',
          prevSlideMessage: 'Previous artwork',
          paginationBulletMessage: 'Go to artwork {{index}}',
        }}
        modules={[
          Autoplay,
          EffectFade,
          Pagination,
          Navigation,
          Scrollbar,
          A11y,
        ]}
      >
        {data.map(item => (
          <SwiperSlide key={item.url} aria-label={item.title}>
            <ArtImage
              src={item.url}
              description={item.description}
              className="h-80 w-full rounded-lg"
            />
          </SwiperSlide>
        ))}
      </Swiper>
      {data.length > 1 && (
        <button
          type="button"
          onClick={toggleAutoPlay}
          aria-label={
            isAutoPlaying ? 'Pause artwork slideshow' : 'Play artwork slideshow'
          }
          className="bg-background/85 text-foreground focus-visible:ring-ring absolute right-3 bottom-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {isAutoPlaying ? (
            <PauseIcon aria-hidden="true" className="h-4 w-4" />
          ) : (
            <PlayIcon aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      )}
    </section>
  )
}
