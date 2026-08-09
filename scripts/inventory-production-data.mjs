import pg from 'pg'

const {Pool} = pg

const TABLES = Object.freeze([
  'users',
  'accounts',
  'sessions',
  'artworks',
  'news_articles',
  'press_items',
  'testimonials',
  'workshop_items',
  'memories',
  'artist_stats',
  'contact_info',
  'media_objects',
  'instagram_posts',
  'password_reset_tokens',
  'verification_tokens',
])

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    [TABLES],
  )
  const existingTables = new Set(existing.rows.map(row => row.table_name))
  const counts = {}

  for (const table of TABLES) {
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

  process.stdout.write(
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        counts,
        media: media.rows,
      },
      null,
      2,
    )}\n`,
  )
} finally {
  await pool.end()
}
