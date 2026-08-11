import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next/image', () => ({
  default: ({
    alt,
    priority,
    unoptimized,
    ...props
  }: React.ComponentProps<'img'> & {
    priority?: boolean
    unoptimized?: boolean
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- semantic test double
    <img
      alt={alt}
      data-priority={String(Boolean(priority))}
      data-unoptimized={String(Boolean(unoptimized))}
      {...props}
    />
  ),
}))

import {PublicEditorialImage} from './public-editorial-image'

describe('PublicEditorialImage', () => {
  it('lets the browser follow the authenticated media redirect directly', () => {
    render(
      <PublicEditorialImage
        media={{
          altText: 'Silent Steppe',
          caption: null,
          credit: 'Bekten Studio',
          crop: 'ORIGINAL',
          displayOrder: 0,
          focalPoint: null,
          height: 1080,
          mediaObjectId: '20000000-0000-4000-8000-000000000008',
          mimeType: 'image/jpeg',
          role: 'HERO',
          url: '/api/media/20000000-0000-4000-8000-000000000008',
          width: 1440,
        }}
        sizes="100vw"
      />,
    )

    expect(screen.getByRole('img', {name: 'Silent Steppe'})).toHaveAttribute(
      'data-unoptimized',
      'true',
    )
  })
})
