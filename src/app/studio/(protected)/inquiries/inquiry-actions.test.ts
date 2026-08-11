import {beforeEach, describe, expect, it, vi} from 'vitest'

import {INITIAL_STUDIO_ACTION_STATE} from '@/components/studio/editorial-action-state'

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
  requireStudioEditor: vi.fn(),
  update: vi.fn(),
}))

vi.mock('next/navigation', () => ({redirect: mocks.redirect}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))
vi.mock('@/server/studio-inquiries/configured-studio-inquiry-service', () => ({
  configuredStudioInquiryService: {update: mocks.update},
}))

import {updateStudioInquiryAction} from './inquiry-actions'

const inquiryId = '00000000-0000-4000-8000-000000000002'

describe('Studio inquiry action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudioEditor.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      role: 'EDITOR',
    })
  })

  it('normalizes inbox labels and persists the private update', async () => {
    const formData = new FormData()

    formData.set('status', 'IN_REVIEW')
    formData.set('labels', 'Priority, private viewing')
    formData.set('note', 'Collector requested an afternoon appointment.')

    await expect(
      updateStudioInquiryAction(
        inquiryId,
        INITIAL_STUDIO_ACTION_STATE,
        formData,
      ),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        inquiryId,
        labels: ['priority', 'private-viewing'],
        note: 'Collector requested an afternoon appointment.',
        status: 'IN_REVIEW',
      }),
    )
  })

  it('returns a safe state for an invalid status', async () => {
    const formData = new FormData()

    formData.set('status', 'DELETED')
    formData.set('labels', '')
    formData.set('note', '')

    await expect(
      updateStudioInquiryAction(
        inquiryId,
        INITIAL_STUDIO_ACTION_STATE,
        formData,
      ),
    ).resolves.toMatchObject({status: 'error'})
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
