import {prisma} from '@/lib/db'
import {configuredSiteLocaleService} from '@/server/site-locales/configured-site-locales'

import {createDatabaseTranslationRepository} from './database-translation-repository'
import {STATIC_TRANSLATION_CATALOGS} from './static-translation-catalogs'
import {mergeTranslationCatalog} from './translation-catalog'
import {createTranslationService} from './translation-service'

import type {TranslationDatabase} from './database-translation-repository'
import type {TranslationLocale} from './translation-service'

const translationDatabase: TranslationDatabase = {
  $transaction: callback =>
    prisma.$transaction(transaction =>
      callback({
        auditEvent: {
          create: arguments_ =>
            transaction.auditEvent.create(arguments_ as never),
        },
        uiTranslationOverride: {
          createMany: arguments_ =>
            transaction.uiTranslationOverride.createMany(arguments_ as never),
          deleteMany: arguments_ =>
            transaction.uiTranslationOverride.deleteMany(arguments_ as never),
        },
      }),
    ),
  uiTranslationOverride: {
    findMany: arguments_ =>
      prisma.uiTranslationOverride.findMany(arguments_ as never),
  },
}

const configuredTranslationRepository =
  createDatabaseTranslationRepository(translationDatabase)
const configuredTranslationService = createTranslationService({
  catalogs: STATIC_TRANSLATION_CATALOGS,
  locales: () => configuredSiteLocaleService.list(),
  repository: configuredTranslationRepository,
})

function shouldRethrowTranslationError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === 'SITE_LOCALE_NOT_FOUND' ||
      error.message === 'SITE_LOCALE_NOT_ACTIVE')
  )
}

async function loadPublicMessages(locale: TranslationLocale) {
  try {
    return await configuredTranslationService.messages(locale)
  } catch (error) {
    if (shouldRethrowTranslationError(error)) throw error

    const errorCode =
      error instanceof Error && /^[A-Z0-9_]+$/u.test(error.message)
        ? error.message
        : 'TRANSLATION_CATALOG_UNAVAILABLE'

    if (process.env.NODE_ENV === 'production') {
      console.error(
        `Translation overrides are unavailable; using static catalogue (${errorCode})`,
      )
    }

    const localized = Object.hasOwn(STATIC_TRANSLATION_CATALOGS, locale)
      ? STATIC_TRANSLATION_CATALOGS[
          locale as keyof typeof STATIC_TRANSLATION_CATALOGS
        ]
      : STATIC_TRANSLATION_CATALOGS.en

    return mergeTranslationCatalog({
      canonical: STATIC_TRANSLATION_CATALOGS.en,
      localized,
      overrides: [],
    })
  }
}

export {
  configuredTranslationService,
  loadPublicMessages,
  shouldRethrowTranslationError,
}
