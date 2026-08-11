import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {StudioSignInForm} from './studio-sign-in-form'

const signIn = vi.hoisted(() => vi.fn())

vi.mock('next-auth/react', () => ({signIn}))

describe('StudioSignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signIn.mockResolvedValue({error: null, ok: true})
  })

  it('requests a private email link and shows the same generic completion state', async () => {
    const user = userEvent.setup()

    render(<StudioSignInForm />)

    await user.type(
      screen.getByRole('textbox', {name: 'Studio email'}),
      ' Owner@Example.COM ',
    )
    await user.click(screen.getByRole('button', {name: 'Send sign-in link'}))

    expect(signIn).toHaveBeenCalledWith('email', {
      callbackUrl: '/studio',
      email: 'owner@example.com',
      redirect: false,
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'If this address has Studio access, a private sign-in link is on its way.',
    )
  })

  it('announces a safe retry message when the protocol request fails', async () => {
    const user = userEvent.setup()

    signIn.mockResolvedValueOnce({error: 'EmailSignin', ok: false})
    render(<StudioSignInForm />)

    await user.type(
      screen.getByRole('textbox', {name: 'Studio email'}),
      'owner@example.com',
    )
    await user.click(screen.getByRole('button', {name: 'Send sign-in link'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The sign-in link could not be requested. Please try again.',
    )
  })

  it('provides an associated email label and submission help', () => {
    render(<StudioSignInForm />)

    const input = screen.getByRole('textbox', {name: 'Studio email'})

    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAccessibleDescription(
      'Only approved editors and owners can enter Bekten Studio.',
    )
  })
})
