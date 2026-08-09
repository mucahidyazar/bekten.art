'use client'

import {useSearchParams} from 'next/navigation'

import {useTranslations} from 'next-intl'

import {useHydrated} from '@/hooks/use-hydrated'

export function ErrorDisplay() {
  const mounted = useHydrated()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const t = useTranslations('auth.status')
  const verified = searchParams.get('verified') === 'true'
  const verificationPending = searchParams.get('verification') === 'pending'

  if (!mounted || (!error && !verified && !verificationPending)) {
    return null
  }

  const message = verified
    ? t('verificationSuccess')
    : verificationPending
      ? t('verificationPending')
      : error === 'rate_limit'
        ? t('rateLimit')
        : t('verificationInvalid')
  const success = verified || verificationPending

  return (
    <div
      role={success ? 'status' : 'alert'}
      className={
        success
          ? 'rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20'
          : 'rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20'
      }
    >
      <p
        className={
          success
            ? 'text-sm text-green-700 dark:text-green-300'
            : 'text-sm text-red-700 dark:text-red-300'
        }
      >
        {message}
      </p>
    </div>
  )
}
