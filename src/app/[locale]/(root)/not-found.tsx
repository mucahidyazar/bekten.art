'use client'

import Link from 'next/link'

import {useLocale} from 'next-intl'

import {
  publicCopyLocale,
  publicLocale,
} from '@/components/public-site/public-copy'
import {localizedPath} from '@/lib/localized-path'

const notFoundCopy = Object.freeze({
  en: Object.freeze({
    description: "The page you're looking for could not be found.",
    returnHome: 'Return home',
  }),
  ky: Object.freeze({
    description: 'Сиз издеген барак табылган жок.',
    returnHome: 'Башкы бетке кайтуу',
  }),
  ru: Object.freeze({
    description: 'Страница, которую вы ищете, не найдена.',
    returnHome: 'Вернуться на главную',
  }),
  tr: Object.freeze({
    description: 'Aradığınız sayfa bulunamadı.',
    returnHome: 'Ana sayfaya dön',
  }),
})

export default function NotFound() {
  const locale = publicLocale(useLocale())
  const copy = notFoundCopy[publicCopyLocale(locale)]

  return (
    <div className="text-foreground mt-[30%] flex h-full flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-7xl">404</h1>
      <p className="mb-2">{copy.description}</p>
      <Link href={localizedPath(locale, '/')} className="text-primary-500">
        {copy.returnHome}
      </Link>
    </div>
  )
}
