// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {PressSection} from './press-section'

const mocks = vi.hoisted(() => ({
  listPublished: vi.fn(),
}))

vi.mock('@/server/database/content', () => ({
  contentRepository: {
    pressItems: {listPublished: mocks.listPublished},
  },
}))

describe('PressSection', () => {
  it('renders published press items from the typed content repository', async () => {
    mocks.listPublished.mockResolvedValue([
      {
        category: 'INTERVIEW',
        content: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        description: 'An interview about contemporary Kyrgyz art.',
        displayOrder: 0,
        id: '018f24dd-c0b7-7a0a-879e-0528df355f2c',
        imageAlt: null,
        imageUrl: null,
        locale: 'tr',
        objectKey: null,
        outlet: 'Art Review',
        publishedAt: new Date('2026-02-01T00:00:00.000Z'),
        publishedOn: new Date('2026-01-31T00:00:00.000Z'),
        sourceUrl: 'https://example.com/interview',
        status: 'PUBLISHED',
        subtitle: null,
        title: 'Sanatçıyla Söyleşi',
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ])

    render(await PressSection({locale: 'tr'}))

    expect(mocks.listPublished).toHaveBeenCalledWith({limit: 8, locale: 'tr'})
    expect(
      screen.getByRole('heading', {name: 'Sanatçıyla Söyleşi'}),
    ).toBeVisible()
    expect(screen.getByText('Art Review')).toBeVisible()
    expect(screen.getByRole('link', {name: /art review/i})).toHaveAttribute(
      'href',
      'https://example.com/interview',
    )
  })

  it('renders a truthful empty state when no press has been published', async () => {
    mocks.listPublished.mockResolvedValue([])

    render(await PressSection({locale: 'en'}))

    expect(screen.getByText(/no press coverage has been published/i)).toBeVisible()
  })
})
