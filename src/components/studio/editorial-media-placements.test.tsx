import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {EditorialMediaPlacements} from './editorial-media-placements'

describe('EditorialMediaPlacements', () => {
  it('selects Garage media with an explicit role and required alternative text', async () => {
    const user = userEvent.setup()
    const {container} = render(
      <EditorialMediaPlacements
        availableMedia={[
          {
            filename: 'winter-light.webp',
            id: '00000000-0000-4000-8000-000000000002',
          },
        ]}
        entityType="ARTWORK"
        initialPlacements={[]}
      />,
    )

    await user.click(
      screen.getByRole('checkbox', {name: 'Use winter-light.webp'}),
    )

    expect(
      screen.getByLabelText('Alternative text for winter-light.webp'),
    ).toBeRequired()
    expect(screen.getByLabelText('Role for winter-light.webp')).toHaveValue(
      'HERO',
    )
    await user.type(
      screen.getByLabelText('Alternative text for winter-light.webp'),
      'Winter landscape in layered blue and umber pigment',
    )

    const hidden = container.querySelector<HTMLInputElement>(
      'input[name="media-placements"]',
    )
    const placements = JSON.parse(hidden?.value ?? '[]')

    expect(placements).toEqual([
      expect.objectContaining({
        displayOrder: 0,
        mediaObjectId: '00000000-0000-4000-8000-000000000002',
        role: 'HERO',
      }),
    ])
  })

  it('keeps existing ordering immutable while moving media', async () => {
    const user = userEvent.setup()
    const availableMedia = [
      {filename: 'first.webp', id: '00000000-0000-4000-8000-000000000002'},
      {filename: 'second.webp', id: '00000000-0000-4000-8000-000000000003'},
    ] as const
    const initialPlacements = availableMedia.map((media, displayOrder) => ({
      altText: `Artwork image ${displayOrder + 1}`,
      caption: null,
      credit: null,
      crop: 'ORIGINAL' as const,
      displayOrder,
      focalPoint: null,
      mediaObjectId: media.id,
      role: displayOrder === 0 ? ('HERO' as const) : ('GALLERY' as const),
    }))

    render(
      <EditorialMediaPlacements
        availableMedia={availableMedia}
        entityType="ARTWORK"
        initialPlacements={initialPlacements}
      />,
    )
    await user.click(
      screen.getByRole('button', {name: 'Move second.webp earlier'}),
    )

    const selected = screen.getAllByTestId('selected-media-name')

    expect(selected.map(item => item.textContent)).toEqual([
      'second.webp',
      'first.webp',
    ])
    expect(initialPlacements[0]?.displayOrder).toBe(0)
  })

  it('keeps a single hero role and removes a deselected placement', async () => {
    const user = userEvent.setup()
    const availableMedia = [
      {filename: 'first.webp', id: '00000000-0000-4000-8000-000000000002'},
      {filename: 'second.webp', id: '00000000-0000-4000-8000-000000000003'},
    ] as const
    const initialPlacements = availableMedia.map((media, displayOrder) => ({
      altText: `Artwork image ${displayOrder + 1}`,
      caption: null,
      credit: null,
      crop: 'ORIGINAL' as const,
      displayOrder,
      focalPoint: null,
      mediaObjectId: media.id,
      role: displayOrder === 0 ? ('HERO' as const) : ('GALLERY' as const),
    }))

    render(
      <EditorialMediaPlacements
        availableMedia={availableMedia}
        entityType="ARTWORK"
        initialPlacements={initialPlacements}
      />,
    )
    await user.selectOptions(
      screen.getByLabelText('Role for second.webp'),
      'HERO',
    )

    expect(screen.getByLabelText('Role for first.webp')).toHaveValue('GALLERY')
    await user.click(screen.getByRole('checkbox', {name: 'Use first.webp'}))
    expect(
      screen.queryByLabelText('Role for first.webp'),
    ).not.toBeInTheDocument()
  })

  it('explains how to begin when Garage has no media', () => {
    render(
      <EditorialMediaPlacements
        availableMedia={[]}
        entityType="PAGE"
        initialPlacements={[]}
      />,
    )

    expect(
      screen.getByText(/upload media in the Studio media library/i),
    ).toBeVisible()
  })
})
