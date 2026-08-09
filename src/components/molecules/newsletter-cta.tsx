'use client'

import {
  ArrowRightIcon,
  CheckIcon,
  LoaderCircleIcon,
  MailIcon,
} from 'lucide-react'
import {useLocale, useTranslations} from 'next-intl'
import {type FormEvent, useState} from 'react'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'

type AppLocale = 'en' | 'tr' | 'ru' | 'ky'

const additionalCopy = {
  en: {
    consent: 'I agree to receive newsletter emails.',
    email: 'Email address',
    error: 'We could not start your subscription. Please try again.',
  },
  ky: {
    consent: 'Жаңылык каттарын алууга макулмун.',
    email: 'Электрондук почта',
    error: 'Жазылууну баштай алган жокпуз. Кайра аракет кылыңыз.',
  },
  ru: {
    consent: 'Я согласен получать письма рассылки.',
    email: 'Электронная почта',
    error: 'Не удалось начать подписку. Попробуйте ещё раз.',
  },
  tr: {
    consent: 'Bülten e-postaları almayı kabul ediyorum.',
    email: 'E-posta adresi',
    error: 'Aboneliğinizi başlatamadık. Lütfen tekrar deneyin.',
  },
} as const

interface NewsletterCTAProps {
  title?: string
  description?: string
  className?: string
}

export function NewsletterCTA({
  title,
  description,
  className = '',
}: NewsletterCTAProps) {
  const locale = useLocale() as AppLocale
  const labels = additionalCopy[locale] ?? additionalCopy.en
  const [consent, setConsent] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const t = useTranslations('cta.newsletter')
  const tForms = useTranslations('forms')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/newsletter', {
        body: JSON.stringify({
          consent,
          email,
          locale,
          source: 'newsletter',
          website: String(form.get('website') ?? ''),
        }),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('NEWSLETTER_SUBMISSION_FAILED')
      }

      setEmail('')
      setConsent(false)
      setIsSuccess(true)
    } catch {
      setError(labels.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20 ${className}`}
        role="status"
      >
        <div className="flex items-center justify-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
            <CheckIcon aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              {tForms('messages.subscribeSuccess')}
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              {tForms('messages.subscribeDescription')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      className={`border-ring/20 bg-card relative overflow-hidden rounded-xl border bg-gradient-to-br via-card to-muted/20 p-6 ${className}`}
    >
      <div aria-hidden="true" className="from-primary/5 absolute inset-0 bg-gradient-to-r via-transparent to-primary/5" />
      <div className="relative">
        <div className="mb-6 text-center">
          <div className="from-primary to-primary/80 shadow-primary/25 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg">
            <MailIcon aria-hidden="true" className="text-primary-foreground h-7 w-7" />
          </div>
          <h3 className="text-foreground mb-2 text-xl font-bold" id="newsletter-title">
            {title || t('title')}
          </h3>
          <p className="text-muted-foreground mx-auto max-w-md leading-relaxed">
            {description || t('description')}
          </p>
        </div>

        <form
          aria-labelledby="newsletter-title"
          className="mx-auto max-w-md space-y-4"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="newsletter-email">
            {labels.email}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              aria-describedby={error ? 'newsletter-error' : undefined}
              autoComplete="email"
              className="border-ring/30 bg-background/80 focus:border-primary/50 h-12 flex-1 shadow-sm backdrop-blur-sm"
              disabled={isSubmitting}
              id="newsletter-email"
              maxLength={320}
              onChange={event => setEmail(event.target.value)}
              placeholder={t('placeholder')}
              required
              type="email"
              value={email}
            />
            <Button
              className="from-primary to-primary/90 h-12 bg-gradient-to-r px-8"
              disabled={isSubmitting || !email || !consent}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircleIcon aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightIcon aria-hidden="true" className="ml-2 h-4 w-4" />
              )}
              {isSubmitting
                ? tForms('buttons.subscribing')
                : tForms('buttons.subscribe')}
            </Button>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
          >
            <label htmlFor="newsletter-website">Website</label>
            <input
              autoComplete="off"
              id="newsletter-website"
              name="website"
              tabIndex={-1}
            />
          </div>
          <label className="text-muted-foreground flex items-start gap-2 text-sm">
            <input
              checked={consent}
              className="border-input mt-0.5 h-4 w-4 rounded"
              disabled={isSubmitting}
              onChange={event => setConsent(event.target.checked)}
              required
              type="checkbox"
            />
            <span>{labels.consent}</span>
          </label>
          {error ? (
            <p className="text-destructive text-sm" id="newsletter-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            <span>{tForms('messages.noSpam')}</span>
            <span>{tForms('messages.unsubscribeAnytime')}</span>
            <span>{tForms('messages.weeklyUpdates')}</span>
          </div>
        </form>
      </div>
    </section>
  )
}
