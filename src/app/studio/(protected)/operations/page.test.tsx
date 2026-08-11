import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  auditEvent: {count: vi.fn()},
  mediaObject: {count: vi.fn()},
  outboxJob: {count: vi.fn()},
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
  requireStudioOwner: vi.fn(),
}))

vi.mock('next/navigation', () => ({redirect: mocks.redirect}))
vi.mock('@/lib/db', () => ({
  prisma: {
    auditEvent: mocks.auditEvent,
    mediaObject: mocks.mediaObject,
    outboxJob: mocks.outboxJob,
  },
}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioOwner: mocks.requireStudioOwner,
}))

import StudioOperationsPage from './page'

describe('Studio operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudioOwner.mockResolvedValue({id: 'owner-1', role: 'OWNER'})
    mocks.outboxJob.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1)
    mocks.mediaObject.count.mockResolvedValue(2)
    mocks.auditEvent.count.mockResolvedValue(8)
  })

  it('shows owner-only operational counts from the database', async () => {
    render(await StudioOperationsPage())

    expect(mocks.requireStudioOwner).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', {name: 'Operations'})).toBeVisible()
    expect(screen.getByText('Pending deliveries')).toBeVisible()
    expect(screen.getByText('Failed deliveries')).toBeVisible()
    expect(screen.getByText('Failed or quarantined media')).toBeVisible()
    expect(screen.getByText('Audit events, last 24 hours')).toBeVisible()
    expect(screen.getByText('3')).toBeVisible()
    expect(screen.getByText('1')).toBeVisible()
    expect(screen.getByText('2')).toBeVisible()
    expect(screen.getByText('8')).toBeVisible()
    expect(mocks.mediaObject.count).toHaveBeenCalledWith({
      where: {status: {in: ['FAILED', 'QUARANTINED']}},
    })
  })

  it('returns an editor to the Studio overview', async () => {
    mocks.requireStudioOwner.mockRejectedValueOnce(
      Object.assign(new Error('Studio owner access required'), {
        statusCode: 403,
      }),
    )

    await expect(StudioOperationsPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.redirect).toHaveBeenCalledWith('/studio')
  })
})
