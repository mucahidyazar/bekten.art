import {z} from 'zod'

import {siteLocaleCodeSchema} from '@/server/site-locales/site-locale-service'

import {
  flattenTranslationCatalog,
  mergeTranslationCatalog,
  validateTranslationValue,
} from './translation-catalog'

import type {
  TranslationObject,
  TranslationOverride,
} from './translation-catalog'

type TranslationLocale = string
type TranslationLocaleDefinition = Readonly<{
  code: string
  direction: 'LTR' | 'RTL'
  englishName: string
  nativeName: string
  sortOrder: number
  status: 'DRAFT' | 'ACTIVE' | 'DISABLED'
}>
type StoredTranslationOverride = TranslationOverride &
  Readonly<{locale: TranslationLocale}>
type ReplaceTranslationKeyInput = Readonly<{
  actorUserId: string
  key: string
  overrides: readonly Readonly<{locale: TranslationLocale; value: string}>[]
}>
type TranslationRepository = Readonly<{
  list: (
    locale?: TranslationLocale,
  ) => Promise<readonly StoredTranslationOverride[]>
  replaceKey: (input: ReplaceTranslationKeyInput) => Promise<void>
}>
type TranslationCatalogs = Readonly<
  Record<TranslationLocale, TranslationObject>
>
type LocaleSource =
  | readonly TranslationLocaleDefinition[]
  | (() => Promise<readonly TranslationLocaleDefinition[]>)

const TRANSLATION_LOCALES = Object.freeze(['en', 'tr', 'ru', 'ky'] as const)
const defaultLocaleDefinitions = Object.freeze([
  {
    code: 'en',
    direction: 'LTR' as const,
    englishName: 'English',
    nativeName: 'English',
    sortOrder: 0,
    status: 'ACTIVE' as const,
  },
  {
    code: 'tr',
    direction: 'LTR' as const,
    englishName: 'Turkish',
    nativeName: 'Türkçe',
    sortOrder: 1,
    status: 'ACTIVE' as const,
  },
  {
    code: 'ru',
    direction: 'LTR' as const,
    englishName: 'Russian',
    nativeName: 'Русский',
    sortOrder: 2,
    status: 'ACTIVE' as const,
  },
  {
    code: 'ky',
    direction: 'LTR' as const,
    englishName: 'Kyrgyz',
    nativeName: 'Кыргызча',
    sortOrder: 3,
    status: 'ACTIVE' as const,
  },
])
const localeDefinitionSchema = z
  .object({
    code: siteLocaleCodeSchema,
    direction: z.enum(['LTR', 'RTL']),
    englishName: z.string().trim().min(2).max(80),
    nativeName: z.string().trim().min(1).max(80),
    sortOrder: z.number().int().min(0).max(1_000),
    status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED']),
  })
  .strict()
const saveRowSchema = z
  .object({
    actorUserId: z.uuid(),
    key: z.string().min(1).max(300),
    values: z.record(siteLocaleCodeSchema, z.string()).refine(
      values => Object.keys(values).length <= 100,
      'Too many translation locales',
    ),
  })
  .strict()

function groupedOverrides(
  overrides: readonly StoredTranslationOverride[],
  localeCodes: readonly string[],
) {
  return Object.freeze(
    Object.fromEntries(
      localeCodes.map(locale => [
        locale,
        Object.freeze(
          Object.fromEntries(
            overrides
              .filter(override => override.locale === locale)
              .map(override => [override.key, override.value]),
          ),
        ),
      ]),
    ) as Record<TranslationLocale, Readonly<Record<string, string>>>,
  )
}

function createTranslationService({
  catalogs,
  locales = defaultLocaleDefinitions,
  repository,
}: Readonly<{
  catalogs: TranslationCatalogs
  locales?: LocaleSource
  repository: TranslationRepository
}>) {
  const canonicalCatalog = catalogs.en

  if (!canonicalCatalog) throw new Error('ENGLISH_TRANSLATION_CATALOG_REQUIRED')

  const canonical = flattenTranslationCatalog(canonicalCatalog)

  async function localeDefinitions() {
    const source = typeof locales === 'function' ? await locales() : locales
    const parsed = z.array(localeDefinitionSchema).min(1).max(100).parse(source)
    const unique = new Set(parsed.map(locale => locale.code))

    if (unique.size !== parsed.length || !unique.has('en')) {
      throw new Error('SITE_LOCALE_REGISTRY_INVALID')
    }

    return Object.freeze(
      [...parsed]
        .sort(
          (left, right) =>
            left.sortOrder - right.sortOrder ||
            left.code.localeCompare(right.code),
        )
        .map(locale => Object.freeze(locale)),
    )
  }

  function localizedDefaults(locale: string) {
    return catalogs[locale] ?? canonicalCatalog
  }

  async function messages(locale: TranslationLocale) {
    const normalizedLocale = siteLocaleCodeSchema.parse(locale)
    const definitions = await localeDefinitions()

    const definition = definitions.find(
      candidate => candidate.code === normalizedLocale,
    )

    if (!definition) {
      throw new Error('SITE_LOCALE_NOT_FOUND')
    }

    if (definition.status !== 'ACTIVE') {
      throw new Error('SITE_LOCALE_NOT_ACTIVE')
    }

    const overrides = await repository.list(normalizedLocale)

    return mergeTranslationCatalog({
      canonical: canonicalCatalog,
      localized: localizedDefaults(normalizedLocale),
      overrides,
    })
  }

  async function workspace() {
    const definitions = await localeDefinitions()
    const localeCodes = definitions.map(locale => locale.code)
    const overrides = await repository.list()
    const byLocale = groupedOverrides(overrides, localeCodes)
    const localizedCatalogs = Object.freeze(
      Object.fromEntries(
        localeCodes.map(locale => [
          locale,
          flattenTranslationCatalog(localizedDefaults(locale)),
        ]),
      ) as Record<TranslationLocale, Readonly<Record<string, string>>>,
    )
    const entries = Object.keys(canonical).map(key => {
      const section = key.split('.')[0]!
      const values = Object.fromEntries(
        localeCodes.map(locale => {
          const customized = Object.hasOwn(byLocale[locale] ?? {}, key)
          const hasDedicatedCatalog = Boolean(catalogs[locale])
          const hasLocalizedDefault =
            hasDedicatedCatalog && Object.hasOwn(localizedCatalogs[locale], key)
          const defaultValue = localizedCatalogs[locale][key] ?? canonical[key]!

          return [
            locale,
            Object.freeze({
              customized,
              defaultValue,
              missing: locale !== 'en' && !hasLocalizedDefault && !customized,
              value: byLocale[locale]?.[key] ?? defaultValue,
            }),
          ]
        }),
      )

      return Object.freeze({
        key,
        section,
        values: Object.freeze(values) as Readonly<
          Record<
            TranslationLocale,
            Readonly<{
              customized: boolean
              defaultValue: string
              missing: boolean
              value: string
            }>
          >
        >,
      })
    })

    return Object.freeze({
      entries: Object.freeze(entries),
      locales: definitions,
      sections: Object.freeze([
        ...new Set(entries.map(entry => entry.section)),
      ]),
    })
  }

  async function saveRow(input: z.input<typeof saveRowSchema>) {
    const parsed = saveRowSchema.parse(input)
    const source = canonical[parsed.key]

    if (!source) throw new Error('TRANSLATION_KEY_UNKNOWN')

    const definitions = await localeDefinitions()
    const localeCodes = definitions.map(locale => locale.code)

    if (
      Object.keys(parsed.values).some(locale => !localeCodes.includes(locale)) ||
      localeCodes.some(locale => typeof parsed.values[locale] !== 'string')
    ) {
      throw new Error('TRANSLATION_LOCALE_SET_INVALID')
    }

    const overrides = localeCodes.flatMap(locale => {
      const value = validateTranslationValue({
        source,
        value: parsed.values[locale]!,
      })
      const defaultValue =
        flattenTranslationCatalog(localizedDefaults(locale))[parsed.key] ?? source

      return value === defaultValue ? [] : [Object.freeze({locale, value})]
    })

    await repository.replaceKey({
      actorUserId: parsed.actorUserId,
      key: parsed.key,
      overrides,
    })
  }

  return Object.freeze({messages, saveRow, workspace})
}

export type {
  ReplaceTranslationKeyInput,
  StoredTranslationOverride,
  TranslationCatalogs,
  TranslationLocale,
  TranslationLocaleDefinition,
  TranslationRepository,
}

export {TRANSLATION_LOCALES, createTranslationService}
