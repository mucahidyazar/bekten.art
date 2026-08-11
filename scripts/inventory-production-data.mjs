import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import pg from 'pg'

const {Pool} = pg

const PRODUCTION_DATA_TABLES = Object.freeze([
  'users',
  'socials',
  'accounts',
  'sessions',
  'verification_tokens',
  'password_reset_tokens',
  'artworks',
  'collections',
  'exhibitions',
  'exhibition_artworks',
  'journal_entries',
  'pages',
  'news_articles',
  'press_items',
  'testimonials',
  'workshop_items',
  'memories',
  'artist_stats',
  'contact_info',
  'feedback',
  'newsletter_subscribers',
  'media_objects',
  'content_media_placements',
  'content_revisions',
  'inquiries',
  'inquiry_internal_notes',
  'audit_events',
  'outbox_jobs',
  'email_webhook_events',
  'auth_rate_limits',
  'ui_translation_overrides',
  'instagram_posts',
])

async function inventoryProductionData(environment = process.env) {
  if (!environment.DATABASE_URL) {
    throw new Error('DATABASE_URL is required')
  }

  const pool = new Pool({
    connectionString: environment.DATABASE_URL,
    connectionTimeoutMillis: 5_000,
    max: 1,
    statement_timeout: 10_000,
  })

  try {
    const existing = await pool.query(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])`,
      [PRODUCTION_DATA_TABLES],
    )
    const existingTables = new Set(existing.rows.map(row => row.table_name))
    const counts = {}

    for (const table of PRODUCTION_DATA_TABLES) {
      if (!existingTables.has(table)) {
        counts[table] = null
        continue
      }

      const result = await pool.query(
        `SELECT COUNT(*)::int AS count FROM "${table}"`,
      )

      counts[table] = result.rows[0].count
    }

    const media = existingTables.has('media_objects')
      ? await pool.query(
          `SELECT provider,
                  COUNT(*)::int AS objects,
                  COALESCE(SUM(size_bytes), 0)::bigint::text AS bytes
             FROM media_objects
            GROUP BY provider
            ORDER BY provider`,
        )
      : {rows: []}

    return Object.freeze({
      capturedAt: new Date().toISOString(),
      counts: Object.freeze({...counts}),
      media: Object.freeze(media.rows.map(row => Object.freeze({...row}))),
    })
  } finally {
    await pool.end()
  }
}

export {PRODUCTION_DATA_TABLES, inventoryProductionData}

const entryUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : ''

if (entryUrl === import.meta.url) {
  inventoryProductionData()
    .then(report => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    })
    .catch(error => {
      process.stderr.write(
        `${error instanceof Error ? error.message : 'Production inventory failed'}\n`,
      )
      process.exitCode = 1
    })
}
