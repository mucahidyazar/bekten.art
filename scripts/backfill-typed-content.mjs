import pg from 'pg'

import {
  buildTypedContentRows,
  deterministicUuid,
} from './lib/legacy-content-backfill.mjs'

const {Pool} = pg
const APPLY = process.argv.includes('--apply')
const LOCALES = Object.freeze(['en', 'tr', 'ru', 'ky'])

const TABLES = Object.freeze({
  artistStats: {
    columns: [
      'id',
      'locale',
      'value',
      'label',
      'description',
      'displayOrder',
      'status',
      'publishedAt',
      'createdAt',
      'updatedAt',
    ],
    databaseColumns: [
      'id',
      'locale',
      'value',
      'label',
      'description',
      'display_order',
      'status',
      'published_at',
      'created_at',
      'updated_at',
    ],
    table: 'artist_stats',
  },
  artworks: {
    columns: [
      'id',
      'locale',
      'slug',
      'title',
      'description',
      'imageUrl',
      'imageAlt',
      'objectKey',
      'medium',
      'dimensions',
      'year',
      'priceMinor',
      'currency',
      'isAvailable',
      'displayOrder',
      'status',
      'publishedAt',
      'createdAt',
      'updatedAt',
    ],
    databaseColumns: [
      'id',
      'locale',
      'slug',
      'title',
      'description',
      'image_url',
      'image_alt',
      'object_key',
      'medium',
      'dimensions',
      'year',
      'price_minor',
      'currency',
      'is_available',
      'display_order',
      'status',
      'published_at',
      'created_at',
      'updated_at',
    ],
    table: 'artworks',
  },
  memories: {
    columns: [
      'id',
      'locale',
      'slug',
      'title',
      'description',
      'imageUrl',
      'imageAlt',
      'objectKey',
      'capturedAt',
      'displayOrder',
      'status',
      'publishedAt',
      'createdAt',
      'updatedAt',
    ],
    databaseColumns: [
      'id',
      'locale',
      'slug',
      'title',
      'description',
      'image_url',
      'image_alt',
      'object_key',
      'captured_at',
      'display_order',
      'status',
      'published_at',
      'created_at',
      'updated_at',
    ],
    table: 'memories',
  },
  newsArticles: {
    columns: [
      'id',
      'locale',
      'slug',
      'title',
      'subtitle',
      'excerpt',
      'body',
      'imageUrl',
      'imageAlt',
      'objectKey',
      'eventAt',
      'location',
      'address',
      'note',
      'sourceUrl',
      'category',
      'displayOrder',
      'status',
      'publishedAt',
      'createdAt',
      'updatedAt',
    ],
    databaseColumns: [
      'id',
      'locale',
      'slug',
      'title',
      'subtitle',
      'excerpt',
      'body',
      'image_url',
      'image_alt',
      'object_key',
      'event_at',
      'location',
      'address',
      'note',
      'source_url',
      'category',
      'display_order',
      'status',
      'published_at',
      'created_at',
      'updated_at',
    ],
    table: 'news_articles',
  },
  testimonials: {
    columns: [
      'id',
      'locale',
      'name',
      'title',
      'company',
      'location',
      'quote',
      'avatarUrl',
      'avatarAlt',
      'objectKey',
      'category',
      'sourceUrl',
      'displayOrder',
      'status',
      'publishedAt',
      'createdAt',
      'updatedAt',
    ],
    databaseColumns: [
      'id',
      'locale',
      'name',
      'title',
      'company',
      'location',
      'quote',
      'avatar_url',
      'avatar_alt',
      'object_key',
      'category',
      'source_url',
      'display_order',
      'status',
      'published_at',
      'created_at',
      'updated_at',
    ],
    table: 'testimonials',
  },
  workshopItems: {
    columns: [
      'id',
      'locale',
      'slug',
      'title',
      'description',
      'imageUrl',
      'imageAlt',
      'objectKey',
      'startsAt',
      'endsAt',
      'location',
      'registrationUrl',
      'displayOrder',
      'status',
      'publishedAt',
      'createdAt',
      'updatedAt',
    ],
    databaseColumns: [
      'id',
      'locale',
      'slug',
      'title',
      'description',
      'image_url',
      'image_alt',
      'object_key',
      'starts_at',
      'ends_at',
      'location',
      'registration_url',
      'display_order',
      'status',
      'published_at',
      'created_at',
      'updated_at',
    ],
    table: 'workshop_items',
  },
})

function quoteIdentifier(value) {
  if (!/^[a-z_]+$/u.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`)
  }

  return `"${value}"`
}

async function upsertRows(client, configuration, rows) {
  const databaseColumns = configuration.databaseColumns.map(quoteIdentifier)
  const assignments = configuration.databaseColumns
    .slice(1)
    .map(column => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`)
    .join(', ')
  const placeholders = configuration.columns.map((_, index) => `$${index + 1}`)
  const query = `INSERT INTO ${quoteIdentifier(configuration.table)} (${databaseColumns.join(', ')})
                 VALUES (${placeholders.join(', ')})
                 ON CONFLICT ("id") DO UPDATE SET ${assignments}`

  for (const row of rows) {
    await client.query(
      query,
      configuration.columns.map(column => row[column] ?? null),
    )
  }

  if (rows.length === 0) {
    return 0
  }

  const result = await client.query(
    `SELECT COUNT(*)::int AS count
       FROM ${quoteIdentifier(configuration.table)}
      WHERE "id" = ANY($1::uuid[])`,
    [rows.map(row => row.id)],
  )

  if (result.rows[0].count !== rows.length) {
    throw new Error(`${configuration.table} verification count mismatch`)
  }

  return result.rows[0].count
}

async function backfillContactInfo(client) {
  const result = await client.query(
    `SELECT id, email, phone, address, working_hours, map_embed_url, instagram
       FROM users
      WHERE role IN ('ADMIN', 'ARTIST')
        AND email IS NOT NULL
        AND phone IS NOT NULL
        AND address IS NOT NULL
      ORDER BY CASE role WHEN 'ADMIN' THEN 0 ELSE 1 END, updated_at DESC
      LIMIT 1`,
  )

  if (result.rows.length === 0) {
    throw new Error('No complete admin/artist contact profile is available')
  }

  const source = result.rows[0]
  const instagram = source.instagram?.trim()
  const instagramUrl = instagram
    ? instagram.startsWith('https://')
      ? instagram
      : `https://instagram.com/${instagram.replace(/^@/u, '')}`
    : null

  for (const locale of LOCALES) {
    await client.query(
      `INSERT INTO contact_info
         (id, locale, email, phone, address, working_hours, map_embed_url,
          instagram_url, is_primary, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (locale) DO UPDATE SET
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         address = EXCLUDED.address,
         working_hours = EXCLUDED.working_hours,
         map_embed_url = EXCLUDED.map_embed_url,
         instagram_url = EXCLUDED.instagram_url,
         is_primary = EXCLUDED.is_primary,
         updated_at = NOW()`,
      [
        deterministicUuid(`contact-info:${locale}:${source.id}`),
        locale,
        source.email,
        source.phone,
        source.address,
        source.working_hours,
        source.map_embed_url,
        instagramUrl,
        locale === 'en',
      ],
    )
  }

  const verification = await client.query(
    'SELECT COUNT(*)::int AS count FROM contact_info WHERE locale = ANY($1::text[])',
    [LOCALES],
  )

  if (verification.rows[0].count < LOCALES.length) {
    throw new Error('contact_info verification count mismatch')
  }

  return LOCALES.length
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5_000,
  max: 1,
  statement_timeout: 20_000,
})
const client = await pool.connect()

try {
  await client.query('BEGIN')
  await client.query("SET LOCAL lock_timeout = '5s'")

  const legacy = await client.query(
    `SELECT id, section_type::text, "order", is_active, created_at, updated_at, data
       FROM section_data
      WHERE section_type IN ('artist', 'memories', 'news', 'store', 'testimonials', 'workshop')
      ORDER BY section_type, "order", id`,
  )
  const typed = buildTypedContentRows(legacy.rows, LOCALES)
  const verified = {}

  for (const [name, configuration] of Object.entries(TABLES)) {
    verified[configuration.table] = await upsertRows(
      client,
      configuration,
      typed[name],
    )
  }

  verified.contact_info = await backfillContactInfo(client)

  if (APPLY) {
    await client.query('COMMIT')
  } else {
    await client.query('ROLLBACK')
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        legacyRows: legacy.rows.length,
        locales: LOCALES.length,
        mode: APPLY ? 'applied' : 'dry-run',
        verified,
      },
      null,
      2,
    )}\n`,
  )
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined)
  throw error
} finally {
  client.release()
  await pool.end()
}
