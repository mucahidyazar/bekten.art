'use client'

import {signIn} from 'next-auth/react'
import {type FormEvent, useId, useState} from 'react'

type SubmissionState = 'idle' | 'submitting' | 'sent' | 'error'

export function StudioSignInForm() {
  const helpId = useId()
  const [state, setState] = useState<SubmissionState>('idle')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const emailField = new FormData(form).get('email')
    const email = typeof emailField === 'string' ? emailField.trim().toLowerCase() : ''

    setState('submitting')

    try {
      const result = await signIn('email', {
        callbackUrl: '/studio',
        email,
        redirect: false,
      })

      setState(result?.error ? 'error' : 'sent')
    } catch {
      setState('error')
    }
  }

  return (
    <form className="grid gap-6" onSubmit={submit}>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="studio-email">
          Studio email
        </label>
        <input
          aria-describedby={helpId}
          autoComplete="email"
          className="min-h-12 rounded-sm border border-stone-400 bg-white/70 px-4 text-base text-stone-950 outline-none transition focus-visible:border-red-900 focus-visible:ring-2 focus-visible:ring-red-900/30"
          disabled={state === 'submitting'}
          id="studio-email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
        <p className="text-sm leading-6 text-stone-600" id={helpId}>
          Only approved editors and owners can enter Bekten Studio.
        </p>
      </div>

      <button
        className="min-h-12 rounded-sm bg-stone-950 px-5 py-3 font-medium text-stone-50 transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-900 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        disabled={state === 'submitting'}
        type="submit"
      >
        {state === 'submitting' ? 'Sending…' : 'Send sign-in link'}
      </button>

      {state === 'sent' ? (
        <p className="text-sm leading-6 text-stone-700" role="status">
          If this address has Studio access, a private sign-in link is on its
          way.
        </p>
      ) : null}
      {state === 'error' ? (
        <p className="text-sm leading-6 text-red-900" role="alert">
          The sign-in link could not be requested. Please try again.
        </p>
      ) : null}
    </form>
  )
}
