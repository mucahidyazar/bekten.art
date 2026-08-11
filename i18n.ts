import {getRequestConfig} from 'next-intl/server'

import {isSafeLocaleCode} from './src/lib/localized-path'
import {loadPublicMessages} from './src/server/translations/configured-translations'

type MessagesLocale = string

export function resolveMessagesLocale(locale: string): MessagesLocale {
  if (!isSafeLocaleCode(locale)) {
    throw new Error(`Unsupported locale: ${locale}`)
  }

  // The catalogue can keep its legacy filename while public URLs use the
  // correct ISO 639-1 language code (`ky`).
  return locale === 'ky' ? 'kg' : locale
}

export default getRequestConfig(async ({requestLocale}) => {
  const locale = (await requestLocale) || 'en'

  resolveMessagesLocale(locale)

  return {
    locale,
    messages: await loadPublicMessages(locale),
  }
})
