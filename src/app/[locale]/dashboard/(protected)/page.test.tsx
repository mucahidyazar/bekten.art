import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

const prisma = vi.hoisted(() => ({
  artwork: {count: vi.fn()},
  collection: {count: vi.fn()},
  inquiry: {count: vi.fn()},
}))

vi.mock('@/lib/db', () => ({prisma}))

import StudioOverviewPage from './page'

describe('Studio overview', () => {
  it('shows real database counts without exposing technical operations', async () => {
    prisma.artwork.count.mockResolvedValueOnce(4).mockResolvedValueOnce(12)
    prisma.collection.count.mockResolvedValueOnce(3)
    prisma.inquiry.count.mockResolvedValueOnce(2)

    render(await StudioOverviewPage())

    expect(
      screen.getByRole('heading', {name: 'Editorial overview'}),
    ).toBeVisible()
    expect(screen.getByText('4')).toBeVisible()
    expect(screen.getByText('12')).toBeVisible()
    expect(screen.getByText('3')).toBeVisible()
    expect(screen.getByText('2')).toBeVisible()
    expect(
      screen.queryByText(/cron|outbox|deployment/i),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Review drafts'})).toHaveAttribute(
      'href',
      '/dashboard/artworks?status=DRAFT',
    )
    expect(
      screen.getByRole('link', {name: 'Open inquiry inbox'}),
    ).toHaveAttribute('href', '/dashboard/inquiries?status=NEW')
  })

  it('provides a useful empty state when no Studio work is waiting', async () => {
    prisma.artwork.count.mockResolvedValue(0)
    prisma.collection.count.mockResolvedValue(0)
    prisma.inquiry.count.mockResolvedValue(0)

    render(await StudioOverviewPage())

    expect(screen.getByText('The Studio queue is clear.')).toBeVisible()
    expect(
      screen.getByRole('link', {name: 'Create an artwork'}),
    ).toHaveAttribute('href', '/dashboard/artworks/new')
  })
})
