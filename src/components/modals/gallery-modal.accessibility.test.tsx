// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {GalleryModal} from './gallery-modal'

vi.mock('next/image', () => ({
  default: ({alt}: {alt: string}) => <span role="img" aria-label={alt} />,
}))
vi.mock('@/lib/media-library', () => ({
  deleteMedia: vi.fn(),
  listMedia: vi.fn().mockResolvedValue([]),
  uploadMedia: vi.fn(),
}))

describe('GalleryModal accessibility', () => {
  it('labels search and exposes image choices as native buttons', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<GalleryModal open onOpenChange={vi.fn()} onSelect={onSelect} />)

    expect(
      screen.getByRole('searchbox', {name: /search images/i}),
    ).toBeVisible()
    const artwork = screen.getByRole('button', {name: /select artwork 1/i})

    artwork.focus()
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('/img/art/art-0.png')
  })
})
