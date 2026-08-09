'use client'

import Link from 'next/link'

import {LoaderCircleIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {type FormEvent, useState} from 'react'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {localizedPath, type AppLocale} from '@/lib/localized-path'

type FormState = 'editing' | 'submitting' | 'success'

function StatusMessage({children}: Readonly<{children: string}>) {
  return (
    <p
      aria-label={children}
      className="border-border bg-muted/40 rounded-lg border p-4 text-sm"
      role="status"
    >
      {children}
    </p>
  )
}

function SignInLink({locale}: Readonly<{locale: AppLocale}>) {
  const t = useTranslations('passwordReset')

  return (
    <Link
      className="text-primary mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
      href={localizedPath(locale, '/sign-in')}
    >
      {t('backToSignIn')}
    </Link>
  )
}

export function PasswordResetRequestForm({
  locale,
}: Readonly<{locale: AppLocale}>) {
  const t = useTranslations('passwordReset')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<FormState>('editing')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setState('submitting')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        body: JSON.stringify({email, locale}),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      })

      if (!response.ok) throw new Error('PASSWORD_RESET_REQUEST_FAILED')

      setState('success')
    } catch {
      setError(t('genericError'))
      setState('editing')
    }
  }

  if (state === 'success') {
    return (
      <div>
        <StatusMessage>{t('requestSuccess')}</StatusMessage>
        <SignInLink locale={locale} />
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="password-reset-email">{t('email')}</Label>
        <Input
          autoComplete="email"
          disabled={state === 'submitting'}
          id="password-reset-email"
          maxLength={320}
          onChange={event => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={state === 'submitting'}
        type="submit"
      >
        {state === 'submitting' ? (
          <LoaderCircleIcon
            aria-hidden="true"
            className="mr-2 h-4 w-4 animate-spin"
          />
        ) : null}
        {state === 'submitting' ? t('requesting') : t('requestButton')}
      </Button>
    </form>
  )
}

export function PasswordResetSubmitForm({
  locale,
  token,
}: Readonly<{locale: AppLocale; token: string}>) {
  const t = useTranslations('passwordReset')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [state, setState] = useState<FormState>('editing')
  const tokenIsValid = /^[A-Za-z0-9_-]{43}$/u.test(token)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t('mismatch'))

      return
    }

    setState('submitting')

    try {
      const response = await fetch('/api/auth/reset-password', {
        body: JSON.stringify({password, token}),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      })

      if (!response.ok) {
        setError(response.status === 400 ? t('invalidLink') : t('genericError'))
        setState('editing')

        return
      }

      setState('success')
    } catch {
      setError(t('genericError'))
      setState('editing')
    }
  }

  if (!tokenIsValid) {
    return (
      <div>
        <p className="text-destructive text-sm" role="alert">
          {t('invalidLink')}
        </p>
        <SignInLink locale={locale} />
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div>
        <StatusMessage>{t('resetSuccess')}</StatusMessage>
        <SignInLink locale={locale} />
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="new-password">{t('newPassword')}</Label>
        <Input
          autoComplete="new-password"
          disabled={state === 'submitting'}
          id="new-password"
          maxLength={1_024}
          minLength={12}
          onChange={event => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">{t('confirmPassword')}</Label>
        <Input
          aria-invalid={Boolean(error)}
          autoComplete="new-password"
          disabled={state === 'submitting'}
          id="confirm-new-password"
          maxLength={1_024}
          minLength={12}
          onChange={event => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={state === 'submitting'}
        type="submit"
      >
        {state === 'submitting' ? (
          <LoaderCircleIcon
            aria-hidden="true"
            className="mr-2 h-4 w-4 animate-spin"
          />
        ) : null}
        {state === 'submitting' ? t('resetting') : t('resetButton')}
      </Button>
    </form>
  )
}
