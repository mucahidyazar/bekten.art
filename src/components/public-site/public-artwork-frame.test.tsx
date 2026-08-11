import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {PublicArtworkFrame} from './public-artwork-frame'

const media = Object.freeze({
  altText: 'A heritage landscape study',
  caption: null,
  credit: null,
  crop: 'ORIGINAL' as const,
  displayOrder: 0,
  focalPoint: null,
  height: 941,
  mediaObjectId: '20000000-0000-4000-8000-000000000008',
  mimeType: 'image/jpeg',
  role: 'HERO' as const,
  url: '/img/heritage-landscape-hero.jpg',
  width: 1672,
})

describe('PublicArtworkFrame', () => {
  it('uses the supplied transparent frame asset over the editorial image', () => {
    render(<PublicArtworkFrame media={media} priority sizes="50vw" />)

    expect(screen.getByRole('img', {name: media.altText})).toHaveAttribute(
      'src',
      expect.stringContaining('heritage-landscape-hero.jpg'),
    )
    expect(screen.getByTestId('heritage-frame-overlay')).toHaveAttribute(
      'src',
      expect.stringContaining('frame.png'),
    )
    expect(screen.getByTestId('heritage-frame-overlay')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })
})
