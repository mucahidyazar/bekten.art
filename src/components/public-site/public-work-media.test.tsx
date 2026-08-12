import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {PublicWorkMedia} from './public-work-media'

import type {PublicEditorialMediaPlacement} from '@/server/public-editorial'

function media(index: number): PublicEditorialMediaPlacement {
  return Object.freeze({
    altText: `Artwork view ${index}`,
    caption: `View ${index}`,
    credit: 'Bekten Usubaliev',
    crop: 'ORIGINAL',
    displayOrder: index - 1,
    focalPoint: null,
    height: 1200,
    mediaObjectId: `50000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    mimeType: 'image/webp',
    role: index === 1 ? 'HERO' : 'GALLERY',
    url: `/api/media/${index}`,
    width: 1600,
  })
}

describe('PublicWorkMedia', () => {
  it('preserves the existing static framed composition for one image', () => {
    render(
      <PublicWorkMedia
        label="Winter Light artwork"
        media={[media(1)]}
        nextLabel="Next image"
        previousLabel="Previous image"
      />,
    )

    expect(screen.getByRole('img', {name: 'Artwork view 1'})).toBeVisible()
    expect(screen.getByTestId('heritage-frame-overlay')).toBeVisible()
    expect(screen.queryByRole('region', {name: /winter light/iu})).toBeNull()
    expect(screen.queryByRole('button', {name: 'Next image'})).toBeNull()
  })

  it('renders keyboard-operable carousel controls and status for multiple images', () => {
    render(
      <PublicWorkMedia
        label="Winter Light artwork"
        media={[media(1), media(2), media(3)]}
        nextLabel="Next image"
        previousLabel="Previous image"
      />,
    )

    const carousel = screen.getByRole('region', {name: 'Winter Light artwork'})
    const next = screen.getByRole('button', {name: 'Next image'})

    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel')
    expect(screen.getByRole('status')).toHaveTextContent('1 / 3')
    expect(screen.getAllByTestId('heritage-frame-overlay')).toHaveLength(3)

    fireEvent.click(next)
    expect(screen.getByRole('status')).toHaveTextContent('2 / 3')

    fireEvent.keyDown(carousel, {key: 'ArrowLeft'})
    expect(screen.getByRole('status')).toHaveTextContent('1 / 3')
  })
})
