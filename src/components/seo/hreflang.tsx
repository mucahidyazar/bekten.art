'use client'

import {usePathname} from 'next/navigation'

interface HrefLangProps {
  locales: string[]
  defaultLocale?: string
}

export function HrefLang({locales, defaultLocale = 'en'}: HrefLangProps) {
  const pathname = usePathname()

  // Extract path without locale
  const segments = pathname.split('/').filter(Boolean)
  const pathWithoutLocale = segments.slice(1).join('/')

  const domain =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art'

  return (
    <>
      {locales.map(locale => {
        const url = `${domain}/${locale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ''}`

        return (
          <link
            key={locale}
            rel="alternate"
            hrefLang={
              locale === 'kg'
                ? 'ky-KG'
                : locale === 'en'
                  ? 'en-US'
                  : locale === 'tr'
                    ? 'tr-TR'
                    : 'ru-RU'
            }
            href={url}
          />
        )
      })}

      {/* Default language fallback */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${domain}/${defaultLocale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ''}`}
      />
    </>
  )
}
