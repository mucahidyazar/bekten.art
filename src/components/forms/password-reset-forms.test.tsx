// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {NextIntlClientProvider} from 'next-intl'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  PasswordResetRequestForm,
  PasswordResetSubmitForm,
} from './password-reset-forms'

const messages = {
  passwordReset: {
    backToSignIn: 'Back to sign in',
    confirmPassword: 'Confirm new password',
    email: 'Email address',
    genericError: 'Unable to process your request.',
    invalidLink: 'This reset link is invalid or expired.',
    mismatch: 'Passwords do not match.',
    newPassword: 'New password',
    requestButton: 'Send reset link',
    requestSuccess: 'Check your inbox for a reset link.',
    requesting: 'Sending reset link...',
    resetButton: 'Reset password',
    resetSuccess: 'Your password has been reset.',
    resetting: 'Resetting password...',
  },
}

function renderWithMessages(node: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>,
  )
}

describe('password reset forms', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('requests a reset using only the same-origin API and selected locale', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({success: true}), {status: 202}),
      )
    const user = userEvent.setup()

    renderWithMessages(<PasswordResetRequestForm locale="en" />)
    await user.type(
      screen.getByLabelText('Email address'),
      'visitor@example.com',
    )
    await user.click(screen.getByRole('button', {name: 'Send reset link'}))

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/forgot-password', {
      body: JSON.stringify({email: 'visitor@example.com', locale: 'en'}),
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
    })
    expect(
      await screen.findByRole('status', {
        name: 'Check your inbox for a reset link.',
      }),
    ).toBeVisible()
  })

  it('blocks mismatched passwords and submits a matching replacement', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({success: true}), {status: 200}),
      )
    const user = userEvent.setup()

    renderWithMessages(
      <PasswordResetSubmitForm locale="en" token={'r'.repeat(43)} />,
    )
    await user.type(
      screen.getByLabelText('New password'),
      'a-new-password-with-entropy',
    )
    await user.type(
      screen.getByLabelText('Confirm new password'),
      'different-password-value',
    )
    await user.click(screen.getByRole('button', {name: 'Reset password'}))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Passwords do not match.',
    )
    expect(fetchMock).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText('Confirm new password'))
    await user.type(
      screen.getByLabelText('Confirm new password'),
      'a-new-password-with-entropy',
    )
    await user.click(screen.getByRole('button', {name: 'Reset password'}))

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/reset-password', {
      body: JSON.stringify({
        password: 'a-new-password-with-entropy',
        token: 'r'.repeat(43),
      }),
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
    })
    expect(
      await screen.findByRole('status', {
        name: 'Your password has been reset.',
      }),
    ).toBeVisible()
  })
})
