import {cache} from 'react'

import {DEFAULT_PUBLIC_LOCALE_OPTIONS} from '@/components/public-site/public-copy'

import {configuredSiteLocaleService} from './configured-site-locales'
import {siteLocaleCodeSchema} from './site-locale-service'

import type {SiteLocale} from './site-locale-service'

type PublicSiteLocaleRegistryOptions = Readonly<{
  fallback: readonly SiteLocale[]
  load: () => Promise<readonly SiteLocale[]>
}>

const FALLBACK_ENGLISH_NAMES = Object.freeze({
  en: 'English',
  ky: 'Kyrgyz',
  ru: 'Russian',
  tr: 'Turkish',
})

const FALLBACK_SITE_LOCALES: readonly SiteLocale[] = Object.freeze(
  DEFAULT_PUBLIC_LOCALE_OPTIONS.map((locale, sortOrder) =>
    Object.freeze({
      ...locale,
      direction: 'LTR' as const,
      englishName:
        FALLBACK_ENGLISH_NAMES[
          locale.code as keyof typeof FALLBACK_ENGLISH_NAMES
        ] ?? locale.nativeName,
      sortOrder,
      status: 'ACTIVE' as const,
    }),
  ),
)

function validActiveLocales(locales: readonly SiteLocale[]) {
  const parsed = locales
    .filter(locale => locale.status === 'ACTIVE')
    .filter(locale => siteLocaleCodeSchema.safeParse(locale.code).success)
    .map(locale => Object.freeze({...locale}))
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.code.localeCompare(right.code),
    )
  const unique = new Map(parsed.map(locale => [locale.code, locale]))

  if (!unique.has('en')) throw new Error('DEFAULT_SITE_LOCALE_REQUIRED')

  return Object.freeze([...unique.values()])
}

function createPublicSiteLocaleRegistry({
  fallback,
  load,
}: PublicSiteLocaleRegistryOptions) {
  const safeFallback = validActiveLocales(fallback)

  async function list() {
    try {
      return validActiveLocales(await load())
    } catch {
      return safeFallback
    }
  }

  async function resolve(code: string) {
    const parsed = siteLocaleCodeSchema.safeParse(code)

    if (!parsed.success) return null

    return (await list()).find(locale => locale.code === parsed.data) ?? null
  }

  return Object.freeze({list, resolve})
}

const loadConfiguredActiveSiteLocales = cache(() =>
  configuredSiteLocaleService.listActive(),
)

const publicSiteLocaleRegistry = createPublicSiteLocaleRegistry({
  fallback: FALLBACK_SITE_LOCALES,
  load: loadConfiguredActiveSiteLocales,
})

export {
  FALLBACK_SITE_LOCALES,
  createPublicSiteLocaleRegistry,
  publicSiteLocaleRegistry,
}
