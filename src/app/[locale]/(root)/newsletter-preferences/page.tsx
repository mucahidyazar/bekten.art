import {notFound} from 'next/navigation'

import {publicCopyLocale, publicLocale} from '@/components/public-site/public-copy'
import {Button} from '@/components/ui/button'

import type {BuiltInPublicLocale} from '@/components/public-site/public-copy'

export const metadata = {
  robots: {follow: false, index: false},
}

const actions = Object.freeze({
  'newsletter-confirm': '/api/newsletter/confirm',
  'newsletter-unsubscribe': '/api/newsletter/unsubscribe',
})

const copy = Object.freeze({
  en: {
    description:
      'For your privacy, your newsletter preference changes only after you confirm below.',
    submit: 'Confirm action',
    title: 'Confirm newsletter preference',
  },
  ky: {
    description:
      'Купуялыгыңыз үчүн, төмөндө ырастагандан кийин гана жаңылык катынын жөндөөсү өзгөрөт.',
    submit: 'Аракетти ырастоо',
    title: 'Жаңылык катынын жөндөөсүн ырастоо',
  },
  ru: {
    description:
      'Для защиты вашей конфиденциальности настройка рассылки изменится только после подтверждения ниже.',
    submit: 'Подтвердить действие',
    title: 'Подтвердите настройку рассылки',
  },
  tr: {
    description:
      'Gizliliğiniz için bülten tercihiniz yalnızca aşağıda onay verdikten sonra değişir.',
    submit: 'İşlemi onayla',
    title: 'Bülten tercihini onaylayın',
  },
}) satisfies Record<
  BuiltInPublicLocale,
  Record<'description' | 'submit' | 'title', string>
>

type Props = Readonly<{
  params: Promise<{locale: string}>
  searchParams: Promise<{action?: string}>
}>

export default async function NewsletterPreferencesPage({
  params,
  searchParams,
}: Props) {
  const [{locale}, query] = await Promise.all([params, searchParams])
  const action = query.action

  if (!action || !(action in actions)) return notFound()

  const text = copy[publicCopyLocale(publicLocale(locale))]
  const endpoint = actions[action as keyof typeof actions]

  return (
    <section
      aria-labelledby="newsletter-preferences-title"
      className="app-container max-w-xl space-y-6 py-16"
    >
      <h1 id="newsletter-preferences-title" className="text-3xl font-bold">
        {text.title}
      </h1>
      <p className="text-muted-foreground leading-7">{text.description}</p>
      <form action={endpoint} method="post">
        <Button type="submit">{text.submit}</Button>
      </form>
    </section>
  )
}
