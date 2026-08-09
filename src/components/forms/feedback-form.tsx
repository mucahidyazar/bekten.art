'use client'

import {LoaderCircleIcon, SendIcon} from 'lucide-react'
import {type FormEvent, useState} from 'react'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'

type AppLocale = 'en' | 'tr' | 'ru' | 'ky'

const copy = {
  en: {
    consent: 'I accept the Privacy Policy and consent to being contacted.',
    email: 'Email address',
    error: 'We could not send your message. Please try again.',
    message: 'Message',
    name: 'Full name',
    privacy: 'Privacy Policy',
    send: 'Send message',
    sending: 'Sending message',
    subject: 'Subject',
    success: 'Your message has been received.',
    title: 'Send a message',
  },
  ky: {
    consent:
      'Купуялык саясатына макулмун жана мени менен байланышууга уруксат берем.',
    email: 'Электрондук почта',
    error: 'Катыңызды жөнөтө алган жокпуз. Кайра аракет кылыңыз.',
    message: 'Билдирүү',
    name: 'Толук аты-жөнү',
    privacy: 'Купуялык саясаты',
    send: 'Билдирүү жөнөтүү',
    sending: 'Билдирүү жөнөтүлүүдө',
    subject: 'Тема',
    success: 'Билдирүүңүз кабыл алынды.',
    title: 'Билдирүү жөнөтүү',
  },
  ru: {
    consent:
      'Я принимаю Политику конфиденциальности и согласен на обратную связь.',
    email: 'Электронная почта',
    error: 'Не удалось отправить сообщение. Попробуйте ещё раз.',
    message: 'Сообщение',
    name: 'Имя и фамилия',
    privacy: 'Политика конфиденциальности',
    send: 'Отправить сообщение',
    sending: 'Сообщение отправляется',
    subject: 'Тема',
    success: 'Ваше сообщение получено.',
    title: 'Отправить сообщение',
  },
  tr: {
    consent:
      'Gizlilik Politikası’nı kabul ediyor ve benimle iletişime geçilmesine onay veriyorum.',
    email: 'E-posta adresi',
    error: 'Mesajınızı gönderemedik. Lütfen tekrar deneyin.',
    message: 'Mesaj',
    name: 'Ad soyad',
    privacy: 'Gizlilik Politikası',
    send: 'Mesaj gönder',
    sending: 'Mesaj gönderiliyor',
    subject: 'Konu',
    success: 'Mesajınız alındı.',
    title: 'Mesaj gönderin',
  },
} as const

export function FeedbackForm({locale}: Readonly<{locale: AppLocale}>) {
  const labels = copy[locale]
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/feedback', {
        body: JSON.stringify({
          email: String(form.get('email') ?? ''),
          locale,
          message: String(form.get('message') ?? ''),
          name: String(form.get('name') ?? ''),
          privacyAccepted: form.get('privacyAccepted') === 'on',
          subject: String(form.get('subject') ?? ''),
          website: String(form.get('website') ?? ''),
        }),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('FEEDBACK_SUBMISSION_FAILED')
      }

      setIsSuccess(true)
      event.currentTarget.reset()
    } catch {
      setError(labels.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="border-border/60 bg-card rounded-2xl border p-6 shadow-lg">
      <h2 className="text-2xl font-semibold" id="feedback-form-title">
        {labels.title}
      </h2>

      {isSuccess ? (
        <p
          className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
          role="status"
        >
          {labels.success}
        </p>
      ) : (
        <form
          aria-labelledby="feedback-form-title"
          className="mt-6 space-y-5"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="feedback-name">{labels.name}</Label>
              <Input
                autoComplete="name"
                disabled={isSubmitting}
                id="feedback-name"
                maxLength={120}
                minLength={2}
                name="name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-email">{labels.email}</Label>
              <Input
                autoComplete="email"
                disabled={isSubmitting}
                id="feedback-email"
                maxLength={320}
                name="email"
                required
                type="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-subject">{labels.subject}</Label>
            <Input
              disabled={isSubmitting}
              id="feedback-subject"
              maxLength={200}
              minLength={2}
              name="subject"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-message">{labels.message}</Label>
            <Textarea
              disabled={isSubmitting}
              id="feedback-message"
              maxLength={10_000}
              minLength={10}
              name="message"
              required
              rows={7}
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
          >
            <Label htmlFor="feedback-website">Website</Label>
            <Input
              autoComplete="off"
              id="feedback-website"
              name="website"
              tabIndex={-1}
            />
          </div>
          <div className="flex items-start gap-3">
            <input
              className="border-input mt-1 h-4 w-4 rounded"
              disabled={isSubmitting}
              id="feedback-privacy"
              name="privacyAccepted"
              required
              type="checkbox"
            />
            <Label className="text-muted-foreground leading-6" htmlFor="feedback-privacy">
              {labels.consent}{' '}
              <a
                className="text-foreground underline underline-offset-4"
                href={`/${locale}/privacy-policy`}
              >
                {labels.privacy}
              </a>
            </Label>
          </div>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <LoaderCircleIcon aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SendIcon aria-hidden="true" className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? labels.sending : labels.send}
          </Button>
        </form>
      )}
    </section>
  )
}
