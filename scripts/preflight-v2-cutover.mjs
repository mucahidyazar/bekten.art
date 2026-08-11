import {createHash} from 'node:crypto'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

const CONTENT_REMOVAL_MIGRATION =
  '20260809220000_remove_legacy_content'
const STORAGE_REMOVAL_MIGRATION =
  '20260809210000_remove_legacy_storage'
const SUPPORTED_LOCALES = Object.freeze(['en', 'tr', 'ru', 'ky'])
const LEGACY_CONTENT_TARGETS = Object.freeze({
  artist: Object.freeze({prefix: 'artist-stat', table: 'artist_stats'}),
  memories: Object.freeze({prefix: 'memory', table: 'memories'}),
  news: Object.freeze({prefix: 'news-article', table: 'news_articles'}),
  store: Object.freeze({prefix: 'artwork', table: 'artworks'}),
  testimonials: Object.freeze({prefix: 'testimonial', table: 'testimonials'}),
  workshop: Object.freeze({prefix: 'workshop-item', table: 'workshop_items'}),
})
const EXPLICIT_PLACEHOLDER_IMAGE =
  /(?:empty-event-image|placeholder|no-image)/iu

function asCount(value, label) {
  const count = Number(value)

  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error(`V2_CUTOVER_INVALID_REPORT:${label}`)
  }

  return count
}

function asRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`V2_CUTOVER_INVALID_LEGACY_ROW:${label}`)
  }

  return value
}

function deterministicUuid(value) {
  const bytes = createHash('sha256').update(value).digest().subarray(0, 16)

  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.toString('hex')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function isSkippedStorePlaceholder(sectionType, data) {
  if (sectionType !== 'store') return false

  const imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl.trim() : ''

  return !imageUrl || EXPLICIT_PLACEHOLDER_IMAGE.test(imageUrl)
}

function expectedLegacyContentTargets(rows, locales = SUPPORTED_LOCALES) {
  return rows.flatMap(rawRow => {
    const row = asRecord(rawRow, 'row')
    const sectionType =
      typeof row.section_type === 'string' ? row.section_type : ''
    const mapping = LEGACY_CONTENT_TARGETS[sectionType]

    if (!mapping) {
      throw new Error(`V2_CUTOVER_UNSUPPORTED_LEGACY_SECTION:${sectionType}`)
    }

    const data = asRecord(row.data, `${sectionType}.data`)

    if (isSkippedStorePlaceholder(sectionType, data)) return []

    if (typeof row.id !== 'string' || !row.id) {
      throw new Error('V2_CUTOVER_INVALID_LEGACY_ROW:id')
    }

    return locales.map(locale =>
      Object.freeze({
        id: deterministicUuid(`${mapping.prefix}:${locale}:${row.id}`),
        table: mapping.table,
      }),
    )
  })
}

function assertV2CutoverSafe(report) {
  const unmappedMedia = asCount(
    report.unmappedLegacyStorageRows,
    'unmappedLegacyStorageRows',
  )
  const missingContent = asCount(
    report.missingLegacyContentTargets,
    'missingLegacyContentTargets',
  )

  asCount(report.legacyStorageRows, 'legacyStorageRows')
  asCount(report.legacyContentRows, 'legacyContentRows')

  if (!report.storageRemovalApplied && unmappedMedia > 0) {
    throw new Error(`V2_CUTOVER_UNMAPPED_LEGACY_MEDIA:${unmappedMedia}`)
  }

  if (!report.contentRemovalApplied && missingContent > 0) {
    throw new Error(`V2_CUTOVER_UNMAPPED_LEGACY_CONTENT:${missingContent}`)
  }
}

async function tableExists(database, table) {
  const rows = await database.$queryRawUnsafe(
    'SELECT to_regclass($1) IS NOT NULL AS "exists"',
    `public.${table}`,
  )

  return rows[0]?.exists === true
}

async function completedMigrations(database) {
  if (!(await tableExists(database, '_prisma_migrations'))) return new Set()

  const rows = await database.$queryRawUnsafe(
    'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
  )

  return new Set(rows.map(row => row.migration_name))
}

async function inspectLegacyStorage(database, removalApplied) {
  if (removalApplied || !(await tableExists(database, 'uploaded_files'))) {
    return Object.freeze({
      legacyStorageRows: 0,
      unmappedLegacyStorageRows: 0,
    })
  }

  const mediaTableExists = await tableExists(database, 'media_objects')
  const rows = mediaTableExists
    ? await database.$queryRawUnsafe(
        'SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE media.id IS NULL) AS unmapped FROM "uploaded_files" AS legacy LEFT JOIN "media_objects" AS media ON media.id = legacy.id',
      )
    : await database.$queryRawUnsafe(
        'SELECT COUNT(*) AS total, COUNT(*) AS unmapped FROM "uploaded_files"',
      )

  return Object.freeze({
    legacyStorageRows: asCount(rows[0]?.total ?? 0, 'legacyStorageRows'),
    unmappedLegacyStorageRows: asCount(
      rows[0]?.unmapped ?? 0,
      'unmappedLegacyStorageRows',
    ),
  })
}

async function inspectLegacyContent(database, removalApplied) {
  if (removalApplied || !(await tableExists(database, 'section_data'))) {
    return Object.freeze({
      legacyContentRows: 0,
      missingLegacyContentTargets: 0,
    })
  }

  const rows = await database.$queryRawUnsafe(
    'SELECT id::text, section_type::text, data FROM "section_data"',
  )
  const targets = expectedLegacyContentTargets(rows)
  const existingIdsByTable = new Map()

  for (const table of new Set(targets.map(target => target.table))) {
    if (!(await tableExists(database, table))) {
      existingIdsByTable.set(table, new Set())
      continue
    }

    const existingRows = await database.$queryRawUnsafe(
      `SELECT id::text FROM "${table}"`,
    )

    existingIdsByTable.set(
      table,
      new Set(existingRows.map(row => row.id)),
    )
  }

  return Object.freeze({
    legacyContentRows: rows.length,
    missingLegacyContentTargets: targets.filter(
      target => !existingIdsByTable.get(target.table)?.has(target.id),
    ).length,
  })
}

async function inspectV2Cutover(database) {
  const migrations = await completedMigrations(database)
  const contentRemovalApplied = migrations.has(CONTENT_REMOVAL_MIGRATION)
  const storageRemovalApplied = migrations.has(STORAGE_REMOVAL_MIGRATION)
  const [content, storage] = await Promise.all([
    inspectLegacyContent(database, contentRemovalApplied),
    inspectLegacyStorage(database, storageRemovalApplied),
  ])

  return Object.freeze({
    contentRemovalApplied,
    ...content,
    ...storage,
    storageRemovalApplied,
  })
}

function createDatabase(environment) {
  const connectionString = environment.DATABASE_URL?.trim() ?? ''

  if (!/^postgres(?:ql)?:\/\//u.test(connectionString)) {
    throw new Error('V2_CUTOVER_DATABASE_CONFIGURATION_INVALID')
  }

  return new PrismaClient({
    adapter: new PrismaPg({connectionString}),
    log: ['error'],
  })
}

async function runV2CutoverPreflight(environment = process.env) {
  const database = createDatabase(environment)

  try {
    const report = await inspectV2Cutover(database)

    assertV2CutoverSafe(report)

    return report
  } finally {
    await database.$disconnect()
  }
}

export {
  assertV2CutoverSafe,
  expectedLegacyContentTargets,
  inspectV2Cutover,
  runV2CutoverPreflight,
}

const entryUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : ''

if (entryUrl === import.meta.url) {
  runV2CutoverPreflight()
    .then(report => {
      console.info(
        `V2 cutover preflight passed: ${report.legacyStorageRows} legacy media and ${report.legacyContentRows} legacy content rows verified.`,
      )
    })
    .catch(error => {
      console.error(
        error instanceof Error && /^V2_CUTOVER_[A-Z0-9_:]+$/u.test(error.message)
          ? error.message
          : 'V2_CUTOVER_PREFLIGHT_FAILED',
      )
      process.exitCode = 1
    })
}
