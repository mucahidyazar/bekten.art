import pg from 'pg'

const {Pool} = pg

const TABLES = Object.freeze([
  'users',
  'accounts',
  'sessions',
  'sections',
  'section_data',
  'uploaded_files',
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

    const result = await pool.query(`SELECT COUNT(*)::int AS count FROM "${table}"`)

    counts[table] = result.rows[0].count
  }

  const media = existingTables.has('uploaded_files')
    ? await pool.query(
        `SELECT storage_provider AS provider,
                COUNT(*)::int AS objects,
                COALESCE(SUM(file_size), 0)::bigint::text AS bytes
           FROM uploaded_files
          GROUP BY storage_provider
          ORDER BY storage_provider`,
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
