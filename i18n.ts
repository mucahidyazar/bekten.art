import {getRequestConfig} from 'next-intl/server'

import {APP_LOCALES, type AppLocale} from './src/lib/localized-path'

type MessagesLocale = Exclude<AppLocale, 'ky'> | 'kg'

export function resolveMessagesLocale(locale: string): MessagesLocale {
  if (!APP_LOCALES.includes(locale as AppLocale)) {
    throw new Error(`Unsupported locale: ${locale}`)
  }

  // The catalogue can keep its legacy filename while public URLs use the
  // correct ISO 639-1 language code (`ky`).
  return locale === 'ky' ? 'kg' : (locale as MessagesLocale)
}

export default getRequestConfig(async ({requestLocale}) => {
  const locale = (await requestLocale) || 'en'
  const messagesLocale = resolveMessagesLocale(locale)

  return {
    locale,
    messages: (await import(`./public/locales/${messagesLocale}/common.json`))
      .default,
  }
})
