import {MetadataRoute} from 'next'

import {prisma} from '@/lib/db'
import {
  APP_LOCALES,
  localizedAlternates,
  localizedPath,
} from '@/lib/localized-path'
import {kebabSlugSchema} from '@/server/editorial-content'
import {publicSiteLocaleRegistry} from '@/server/site-locales/public-site-locales'

import type {AppLocale} from '@/lib/localized-path'

export const dynamic = 'force-dynamic'

const FALLBACK_DOMAIN = 'https://bekten.art'
const STATIC_PAGES = [
  {path: '/', changeFrequency: 'monthly', priority: 1},
  {path: '/works', changeFrequency: 'weekly', priority: 0.9},
  {path: '/available-works', changeFrequency: 'weekly', priority: 0.9},
  {path: '/collections', changeFrequency: 'weekly', priority: 0.8},
  {path: '/exhibitions', changeFrequency: 'weekly', priority: 0.8},
  {path: '/journal', changeFrequency: 'weekly', priority: 0.7},
  {path: '/press', changeFrequency: 'monthly', priority: 0.7},
  {path: '/about', changeFrequency: 'monthly', priority: 0.8},
  {path: '/studio', changeFrequency: 'monthly', priority: 0.7},
  {path: '/collectors', changeFrequency: 'monthly', priority: 0.7},
  {path: '/commission-a-work', changeFrequency: 'monthly', priority: 0.8},
  {path: '/private-viewings', changeFrequency: 'monthly', priority: 0.8},
  {path: '/contact', changeFrequency: 'monthly', priority: 0.7},
  {path: '/archive', changeFrequency: 'monthly', priority: 0.6},
  {path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.2},
  {path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.2},
] as const
const FULLY_TRANSLATABLE_DYNAMIC_PATHS = new Set([
  '/privacy-policy',
  '/terms-of-service',
])
const PUBLISHED_ENTITY_QUERY = Object.freeze({
  orderBy: [{updatedAt: 'desc' as const}, {id: 'asc' as const}],
  select: {
    id: true,
    locale: true,
    publishedAt: true,
    updatedAt: true,
    version: true,
  },
  where: {publishedAt: {not: null}, status: 'PUBLISHED' as const},
})

type PublishedEntityRow = Readonly<{
  id: string
  locale: string
  publishedAt: Date | null
  updatedAt: Date
  version: number
}>

type PublishedRevisionRow = Readonly<{
  createdAt: Date
  entityId: string
  entityType: string
  locale: string
  snapshot: unknown
  version: number
}>

type ValidPublishedEntityRow = PublishedEntityRow &
  Readonly<{locale: AppLocale; publishedAt: Date}>

type EntityGroup = Readonly<{
  entityType:
    'ARTWORK' | 'COLLECTION' | 'EXHIBITION' | 'JOURNAL_ENTRY' | 'PRESS_ENTRY'
  path: string
  rows: readonly PublishedEntityRow[]
}>

function domain() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_APP_URL || FALLBACK_DOMAIN)

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.origin
      : FALLBACK_DOMAIN
  } catch {
    return FALLBACK_DOMAIN
  }
}

function isAppLocale(
  locale: string,
  activeLocales: readonly string[] = APP_LOCALES,
): locale is AppLocale {
  return activeLocales.some(candidate => candidate === locale)
}

function staticEntries(
  origin: string,
  activeLocales: readonly string[],
): MetadataRoute.Sitemap {
  return STATIC_PAGES.flatMap(page => {
    const pageLocales = FULLY_TRANSLATABLE_DYNAMIC_PATHS.has(page.path)
      ? activeLocales
      : activeLocales.filter(locale =>
          APP_LOCALES.some(builtInLocale => builtInLocale === locale),
        )
    const languages = localizedAlternates(origin, page.path, pageLocales)

    return pageLocales.map(locale => ({
      url: `${origin}${localizedPath(locale, page.path)}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {languages},
    }))
  })
}

function validPublishedRow(
  row: PublishedEntityRow,
  activeLocales: readonly string[] = APP_LOCALES,
): row is ValidPublishedEntityRow {
  return (
    typeof row.id === 'string' &&
    isAppLocale(row.locale, activeLocales) &&
    row.publishedAt instanceof Date &&
    !Number.isNaN(row.publishedAt.valueOf()) &&
    row.updatedAt instanceof Date &&
    !Number.isNaN(row.updatedAt.valueOf()) &&
    Number.isInteger(row.version) &&
    row.version > 0
  )
}

function snapshotSlug(revision: PublishedRevisionRow, locale: AppLocale) {
  if (
    revision.locale !== locale ||
    revision.snapshot === null ||
    typeof revision.snapshot !== 'object' ||
    Array.isArray(revision.snapshot)
  ) {
    return null
  }

  const snapshot = revision.snapshot as Readonly<Record<string, unknown>>

  if (
    snapshot.locale !== locale ||
    snapshot.seo === null ||
    typeof snapshot.seo !== 'object' ||
    Array.isArray(snapshot.seo) ||
    (snapshot.seo as Readonly<Record<string, unknown>>).noIndex !== false
  ) {
    return null
  }

  const slug = kebabSlugSchema.safeParse(snapshot.slug)

  return slug.success ? slug.data : null
}

function latestPublishedRevision(
  revisions: readonly PublishedRevisionRow[],
  group: EntityGroup,
  row: PublishedEntityRow,
) {
  return revisions.find(
    revision =>
      revision.entityId === row.id &&
      revision.entityType === group.entityType &&
      revision.locale === row.locale &&
      revision.version <= row.version &&
      Number.isInteger(revision.version) &&
      revision.version > 0 &&
      revision.createdAt instanceof Date &&
      !Number.isNaN(revision.createdAt.valueOf()),
  )
}

function mostRecentDate(...dates: readonly Date[]) {
  return new Date(Math.max(...dates.map(date => date.valueOf())))
}

async function dynamicEntries(
  origin: string,
  activeLocales: readonly string[],
): Promise<MetadataRoute.Sitemap> {
  const [artworks, collections, exhibitions, journalEntries, pressEntries] =
    await Promise.all([
      prisma.artwork.findMany(PUBLISHED_ENTITY_QUERY),
      prisma.collection.findMany(PUBLISHED_ENTITY_QUERY),
      prisma.exhibition.findMany(PUBLISHED_ENTITY_QUERY),
      prisma.journalEntry.findMany(PUBLISHED_ENTITY_QUERY),
      prisma.pressItem.findMany(PUBLISHED_ENTITY_QUERY),
    ])
  const groups: readonly EntityGroup[] = [
    {entityType: 'ARTWORK', path: '/works', rows: artworks},
    {entityType: 'COLLECTION', path: '/collections', rows: collections},
    {entityType: 'EXHIBITION', path: '/exhibitions', rows: exhibitions},
    {entityType: 'JOURNAL_ENTRY', path: '/journal', rows: journalEntries},
    {entityType: 'PRESS_ENTRY', path: '/press', rows: pressEntries},
  ]
  const entityIds = groups.flatMap(group =>
    group.rows
      .filter(row => validPublishedRow(row, activeLocales))
      .map(row => row.id),
  )

  if (entityIds.length === 0) return []

  const revisions = await prisma.contentRevision.findMany({
    orderBy: [{entityId: 'asc'}, {version: 'desc'}, {createdAt: 'desc'}],
    select: {
      createdAt: true,
      entityId: true,
      entityType: true,
      locale: true,
      snapshot: true,
      version: true,
    },
    where: {
      entityId: {in: entityIds},
      entityType: {in: groups.map(group => group.entityType)},
    },
  })

  return groups.flatMap(group =>
    group.rows.flatMap(row => {
      if (!validPublishedRow(row, activeLocales)) return []

      const revision = latestPublishedRevision(revisions, group, row)

      if (!revision) return []

      const slug = snapshotSlug(revision, row.locale)

      if (!slug) return []

      const publicPath = `${group.path}/${encodeURIComponent(slug)}`

      return [
        {
          url: `${origin}${localizedPath(row.locale, publicPath)}`,
          lastModified: mostRecentDate(
            row.publishedAt,
            row.updatedAt,
            revision.createdAt,
          ),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        },
      ]
    }),
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = domain()
  const activeLocales = (await publicSiteLocaleRegistry.list()).map(
    locale => locale.code,
  )
  const indexableStaticEntries = staticEntries(origin, activeLocales)

  try {
    return [
      ...indexableStaticEntries,
      ...(await dynamicEntries(origin, activeLocales)),
    ]
  } catch {
    return indexableStaticEntries
  }
}
