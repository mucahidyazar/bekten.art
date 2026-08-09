import {notFound} from 'next/navigation'

import {Button} from '@/components/ui/button'

import type {AppLocale} from '@/lib/localized-path'

const actions = Object.freeze({
  'newsletter-confirm': '/api/newsletter/confirm',
  'newsletter-unsubscribe': '/api/newsletter/unsubscribe',
  'verify-email': '/api/auth/verify-email',
})

const copy = Object.freeze({
  en: {
    description: 'For your security, this link changes your account only after you confirm below.',
    submit: 'Confirm action',
    title: 'Confirm email action',
  },
  ky: {
    description: 'Коопсуздук үчүн, төмөндө ырастагандан кийин гана бул шилтеме аккаунтуңузду өзгөртөт.',
    submit: 'Аракетти ырастоо',
    title: 'Электрондук почта аракетин ырастоо',
  },
  ru: {
    description: 'В целях безопасности ссылка изменит вашу учётную запись только после подтверждения ниже.',
    submit: 'Подтвердить действие',
    title: 'Подтвердите действие с электронной почтой',
  },
  tr: {
    description: 'Güvenliğiniz için bu bağlantı, yalnızca aşağıda onay verdikten sonra hesabınızı değiştirir.',
    submit: 'İşlemi onayla',
    title: 'E-posta işlemini onaylayın',
  },
}) satisfies Record<AppLocale, Record<'description' | 'submit' | 'title', string>>

type Props = Readonly<{
  params: Promise<{locale: AppLocale}>
  searchParams: Promise<{action?: string}>
}>

export default async function ConfirmEmailActionPage({params, searchParams}: Props) {
  const [{locale}, query] = await Promise.all([params, searchParams])
  const action = query.action

  if (!action || !(action in actions) || !(locale in copy)) notFound()

  const text = copy[locale]
  const endpoint = actions[action as keyof typeof actions]

  return (
    <section aria-labelledby="confirm-email-action-title" className="app-container max-w-xl space-y-6 py-16">
      <h1 id="confirm-email-action-title" className="text-3xl font-bold">
        {text.title}
      </h1>
      <p className="text-muted-foreground leading-7">{text.description}</p>
      <form action={endpoint} method="post">
        <Button type="submit">{text.submit}</Button>
      </form>
    </section>
  )
}
