import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const prisma = vi.hoisted(() => ({
  artwork: {count: vi.fn()},
  collection: {count: vi.fn()},
  inquiry: {count: vi.fn()},
}))
const requireStudioEditor = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({prisma}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor,
}))

import StudioOverviewPage from './page'

describe('Studio overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows real database counts without exposing technical operations', async () => {
    requireStudioEditor.mockResolvedValue({id: 'editor-1', role: 'EDITOR'})
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
    expect(requireStudioEditor).toHaveBeenCalledOnce()
  })

  it('provides a useful empty state when no Studio work is waiting', async () => {
    requireStudioEditor.mockResolvedValue({id: 'editor-1', role: 'EDITOR'})
    prisma.artwork.count.mockResolvedValue(0)
    prisma.collection.count.mockResolvedValue(0)
    prisma.inquiry.count.mockResolvedValue(0)

    render(await StudioOverviewPage())

    expect(screen.getByText('The Studio queue is clear.')).toBeVisible()
    expect(
      screen.getByRole('link', {name: 'Create an artwork'}),
    ).toHaveAttribute('href', '/dashboard/artworks/new')
  })

  it('does not query dashboard data when leaf access is revoked', async () => {
    requireStudioEditor.mockRejectedValueOnce(new Error('FORBIDDEN'))

    await expect(StudioOverviewPage()).rejects.toThrow('FORBIDDEN')
    expect(prisma.artwork.count).not.toHaveBeenCalled()
    expect(prisma.collection.count).not.toHaveBeenCalled()
    expect(prisma.inquiry.count).not.toHaveBeenCalled()
  })
})
