// @vitest-environment jsdom

import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {HomeSwiper} from '../organisms/home-swiper'

import {HeroVideo} from './hero-video'
import {TestimonialsSection} from './testimonials-section'

import type {Testimonial} from '@/server/content/domain'

let reducedMotion = false
let swiperProps: Record<string, unknown> = {}

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

vi.mock('swiper/react', () => ({
  Swiper: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => {
    swiperProps = props

    return <div data-testid="swiper">{children}</div>
  },
  SwiperSlide: ({children}: React.PropsWithChildren) => <div>{children}</div>,
}))
vi.mock('swiper/modules', () => ({
  A11y: 'A11y',
  Autoplay: 'Autoplay',
  EffectFade: 'EffectFade',
  Navigation: 'Navigation',
  Pagination: 'Pagination',
  Scrollbar: 'Scrollbar',
}))
vi.mock('@/components/molecules/art-image', () => ({
  ArtImage: ({description}: {description: string}) => (
    <span>{description}</span>
  ),
}))
vi.mock('next/image', () => ({
  default: ({alt}: {alt: string}) => <span role="img" aria-label={alt} />,
}))
vi.mock('next-intl', () => ({
  useTranslations:
    (namespace?: string) =>
    (key: string, values?: {index?: number}) => {
      if (namespace === 'common') {
        return {next: 'Next', previous: 'Previous', view: 'View'}[key] ?? key
      }

      return (
        {
          pauseAutoplay: 'Pause testimonial autoplay',
          showTestimonial: `Show testimonial ${values?.index ?? ''}`,
          startAutoplay: 'Start testimonial autoplay',
          title: 'Testimonials',
        }[key] ?? key
      )
    },
}))
vi.mock('@/components/molecules/section-header', () => ({
  SectionHeader: () => <h2>Testimonials</h2>,
}))

const testimonialDate = new Date('2026-01-01T00:00:00.000Z')
const testimonials: Testimonial[] = [
  {
    avatarAlt: null,
    avatarUrl: null,
    category: 'COLLECTOR',
    company: null,
    createdAt: testimonialDate,
    displayOrder: 0,
    id: '10000000-0000-4000-8000-000000000001',
    locale: 'en',
    location: 'London',
    name: 'Ada',
    objectKey: null,
    publishedAt: testimonialDate,
    quote: 'A thoughtful and memorable collection.',
    sourceUrl: null,
    status: 'PUBLISHED',
    title: 'Collector',
    updatedAt: testimonialDate,
  },
  {
    avatarAlt: null,
    avatarUrl: null,
    category: 'ARTIST',
    company: null,
    createdAt: testimonialDate,
    displayOrder: 1,
    id: '10000000-0000-4000-8000-000000000002',
    locale: 'en',
    location: 'New York',
    name: 'Grace',
    objectKey: null,
    publishedAt: testimonialDate,
    quote: 'The work carries an unmistakable emotional depth.',
    sourceUrl: null,
    status: 'PUBLISHED',
    title: 'Artist',
    updatedAt: testimonialDate,
  },
]

describe('public media accessibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    reducedMotion = false
    swiperProps = {}
    installMatchMedia()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  it('gives the background video a pause control', async () => {
    const user = userEvent.setup()

    render(<HeroVideo />)

    const pause = await screen.findByRole('button', {
      name: /pause background video/i,
    })

    await user.click(pause)

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
    expect(
      screen.getByRole('button', {name: /play background video/i}),
    ).toBeVisible()
  })

  it('does not autoplay the hero video or carousel with reduced motion', async () => {
    reducedMotion = true
    render(<HeroVideo />)
    render(
      <HomeSwiper
        data={[{url: '/art.jpg', title: 'Art', description: 'Artwork'}]}
      />,
    )

    await waitFor(() => expect(swiperProps.autoplay).toBe(false))
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('names carousel controls and starts paused for reduced motion', async () => {
    reducedMotion = true
    render(<TestimonialsSection items={testimonials} />)

    expect(screen.getByRole('region', {name: /testimonials/i})).toBeVisible()
    expect(
      screen.getByRole('button', {name: /previous testimonial/i}),
    ).toBeVisible()
    expect(
      screen.getByRole('button', {name: /next testimonial/i}),
    ).toBeVisible()
    expect(
      screen.getByRole('button', {name: /show testimonial 1/i}),
    ).toHaveAttribute('aria-current', 'true')
    expect(
      screen.getByRole('button', {name: /show testimonial 2/i}),
    ).toHaveClass('h-6', 'w-6')
    expect(
      screen.getByRole('button', {name: /start testimonial autoplay/i}),
    ).toBeVisible()
  })
})
