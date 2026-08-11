'use client'

import {signIn} from 'next-auth/react'
import {type FormEvent, useId, useState} from 'react'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'

type SubmissionState = 'idle' | 'submitting' | 'sent' | 'error'

export function StudioSignInForm() {
  const helpId = useId()
  const [state, setState] = useState<SubmissionState>('idle')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const emailField = new FormData(form).get('email')
    const email =
      typeof emailField === 'string' ? emailField.trim().toLowerCase() : ''

    setState('submitting')

    try {
      const result = await signIn('email', {
        callbackUrl: '/dashboard',
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
        <Label htmlFor="studio-email">
          Studio email
        </Label>
        <Input
          aria-describedby={helpId}
          autoComplete="email"
          className="min-h-12 border-stone-500/45 bg-[#fffaf0] px-4 text-base focus-visible:border-[#6f2a1a] focus-visible:ring-2 focus-visible:ring-[#6f2a1a]/30"
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

      <Button
        className="min-h-12 bg-[#6f2a1a] px-5 text-[#fffaf0] hover:bg-[#542014]"
        disabled={state === 'submitting'}
        isLoading={state === 'submitting'}
        size="lg"
        type="submit"
      >
        {state === 'submitting' ? 'Sending…' : 'Send sign-in link'}
      </Button>

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
