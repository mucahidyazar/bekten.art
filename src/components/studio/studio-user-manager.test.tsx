import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({refresh: vi.fn()}))

vi.mock('next/navigation', () => ({useRouter: () => mocks}))

import {StudioUserManager} from './studio-user-manager'

const users = [
  {
    acceptedAt: null,
    createdAt: '2026-08-11T12:00:00.000Z',
    email: 'editor@example.com',
    id: '11111111-1111-4111-8111-111111111111',
    invitedAt: '2026-08-11T12:00:00.000Z',
    lastSignInAt: null,
    name: 'Editorial assistant',
    role: 'EDITOR' as const,
    status: 'INVITED' as const,
    suspendedAt: null,
    version: 0,
  },
]

describe('StudioUserManager', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows role, status and invitation actions without exposing session data', () => {
    render(<StudioUserManager initialUsers={users} />)

    expect(screen.getByText('editor@example.com')).toBeVisible()
    expect(screen.getAllByText('Invited')[0]).toBeVisible()
    expect(screen.getByRole('button', {name: 'Resend invite'})).toBeVisible()
    expect(screen.queryByText(/session-token/i)).not.toBeInTheDocument()
  })

  it('creates a validated invitation through the protected users API', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({success: true}), {status: 200}),
    )

    render(<StudioUserManager initialUsers={[]} />)
    await user.click(screen.getByRole('button', {name: 'Invite user'}))
    await user.type(screen.getByLabelText('Email address'), 'new@example.com')
    await user.type(screen.getByLabelText('Display name'), 'New editor')
    await user.click(screen.getByRole('button', {name: 'Send invitation'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/dashboard/users',
      expect.objectContaining({
        body: JSON.stringify({
          action: 'user.invite',
          email: 'new@example.com',
          name: 'New editor',
          role: 'EDITOR',
        }),
        method: 'POST',
      }),
    )
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })
})
