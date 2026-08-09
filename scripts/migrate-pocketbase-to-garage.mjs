// One-shot PocketBase cutover utility. It is read-only unless --apply is supplied.
// Remove this file after the verified production cutover and PocketBase shutdown.
import {createHash} from 'node:crypto'

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {fileTypeFromBuffer} from 'file-type'
import pg from 'pg'

import {validateLegacySourceUrl} from './lib/legacy-source.mjs'
import {
  boundedBodyBytes,
  boundedText,
  safeLegacyObjectKey,
  validateCanonicalHttpsUrl,
} from './media-safety.mjs'

const {Pool} = pg
const APPLY = process.argv.includes('--apply')
const MAX_OBJECT_BYTES = 25 * 1024 * 1024
const MIGRATION_LOCK_ID = 2026080901
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function required(name) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

function pocketBaseUrl() {
  return validateLegacySourceUrl(required('POCKETBASE_URL'), {
    allowPrivateHttp:
      process.env.ALLOW_PRIVATE_HTTP_LEGACY_SOURCE?.trim() === 'true',
  })
}

async function authenticatePocketBase() {
  const response = await fetch(
    `${pocketBaseUrl()}/api/collections/_superusers/auth-with-password`,
    {
      body: JSON.stringify({
        identity: required('POCKETBASE_ADMIN_EMAIL'),
        password: required('POCKETBASE_ADMIN_PASSWORD'),
      }),
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    },
  )

  if (!response.ok) {
    throw new Error(`PocketBase authentication failed (${response.status})`)
  }

  const payload = JSON.parse(
    (await boundedBodyBytes(response.body, 64 * 1024)).toString('utf8'),
  )

  if (!payload.token) {
    throw new Error('PocketBase authentication returned no token')
  }

  return payload.token
}

async function downloadLegacyObject(row, token) {
  const collection = row.storage_collection || required('POCKETBASE_STORAGE_COLLECTION')
  const response = await fetch(
    `${pocketBaseUrl()}/api/files/${encodeURIComponent(collection)}/${encodeURIComponent(row.storage_record_id)}/${encodeURIComponent(row.name)}`,
    {
      headers: {Authorization: token},
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    },
  )

  if (!response.ok) {
    throw new Error(`Legacy object download failed (${response.status}) for ${row.id}`)
  }

  const declaredLength = Number(response.headers.get('content-length') || '0')

  if (declaredLength > MAX_OBJECT_BYTES) {
    throw new Error(`Legacy object exceeds migration limit for ${row.id}`)
  }

  const bytes = await boundedBodyBytes(response.body, MAX_OBJECT_BYTES)

  return bytes
}

async function bodyBytes(body) {
  if (body && typeof body.transformToByteArray === 'function') {
    const bytes = Buffer.from(await body.transformToByteArray())

    if (bytes.byteLength > MAX_OBJECT_BYTES) {
      throw new Error('Garage verification exceeds the size limit')
    }

    return bytes
  }

  return boundedBodyBytes(body, MAX_OBJECT_BYTES)
}

const database = new Pool({
  connectionString: required('DATABASE_URL'),
  connectionTimeoutMillis: 5_000,
  max: 2,
  statement_timeout: 30_000,
})

function createStorage() {
  let endpoint

  try {
    endpoint = new URL(required('MEDIA_S3_ENDPOINT'))
  } catch {
    throw new Error('MEDIA_S3_ENDPOINT is invalid')
  }

  const bucket = required('MEDIA_S3_BUCKET')

  if (
    endpoint.protocol !== 'https:' ||
    endpoint.username ||
    endpoint.password ||
    endpoint.pathname !== '/' ||
    endpoint.search ||
    endpoint.hash ||
    !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u.test(bucket) ||
    bucket.includes('..') ||
    required('MEDIA_S3_FORCE_PATH_STYLE') !== 'true'
  ) {
    throw new Error('Garage migration storage configuration is invalid')
  }

  return Object.freeze({
    bucket,
    client: new S3Client({
      credentials: {
        accessKeyId: required('MEDIA_S3_ACCESS_KEY_ID'),
        secretAccessKey: required('MEDIA_S3_SECRET_ACCESS_KEY'),
      },
      endpoint: endpoint.toString(),
      forcePathStyle: true,
      region: required('MEDIA_S3_REGION'),
    }),
  })
}

const coordinator = await database.connect()
let storage = null

try {
  const lock = await coordinator.query(
    'SELECT pg_try_advisory_lock($1) AS acquired',
    [MIGRATION_LOCK_ID],
  )

  if (!lock.rows[0]?.acquired) {
    throw new Error('Another PocketBase migration is already running')
  }

  const legacy = await coordinator.query(
    `SELECT id, name, original_name, file_path, file_size, file_type,
            storage_collection, storage_record_id, uploaded_at, created_at
       FROM uploaded_files
      WHERE storage_provider = 'pocketbase'
      ORDER BY uploaded_at ASC`,
  )

  process.stdout.write(
    `${JSON.stringify({apply: APPLY, legacyObjects: legacy.rowCount})}\n`,
  )

  if (!APPLY || legacy.rowCount === 0) {
    process.exitCode = 0
  } else {
    storage = createStorage()
    const canonicalAppUrl = validateCanonicalHttpsUrl(
      required('NEXT_PUBLIC_APP_URL'),
    )
    const token = await authenticatePocketBase()
    let migrated = 0

    for (const row of legacy.rows) {
      if (!row.storage_record_id) {
        throw new Error(`Missing PocketBase record id for ${row.id}`)
      }

      const objectKey = safeLegacyObjectKey(row.file_path, row.id)
      const bytes = await downloadLegacyObject(row, token)
      const detected = await fileTypeFromBuffer(bytes)

      if (!detected || !SUPPORTED_IMAGE_TYPES.has(detected.mime)) {
        throw new Error(`Legacy object is not a supported image for ${row.id}`)
      }

      const checksum = createHash('sha256').update(bytes).digest('base64')
      const checksumHex = createHash('sha256').update(bytes).digest('hex')

      try {
        await storage.client.send(
          new PutObjectCommand({
            Body: bytes,
            Bucket: storage.bucket,
            CacheControl: 'public, max-age=31536000, immutable, no-transform',
            ChecksumSHA256: checksum,
            ContentLength: bytes.length,
            ContentType: detected.mime,
            Key: objectKey,
            Metadata: {legacy_id: row.id, sha256: checksum},
          }),
        )

        const verified = await storage.client.send(
          new GetObjectCommand({Bucket: storage.bucket, Key: objectKey}),
        )
        const verifiedBytes = await bodyBytes(verified.Body)
        const verifiedChecksum = createHash('sha256')
          .update(verifiedBytes)
          .digest('base64')

        if (verifiedBytes.byteLength !== bytes.byteLength || verifiedChecksum !== checksum) {
          throw new Error(`Checksum mismatch for ${row.id}`)
        }

        await coordinator.query('BEGIN')
        const updated = await coordinator.query(
          `UPDATE uploaded_files
              SET storage_provider = 'garage',
                  storage_collection = $1,
                  storage_record_id = $2,
                  file_path = $2,
                  public_url = $3,
                  file_size = $4,
                  file_type = $5,
                  updated_at = NOW()
            WHERE id = $6
              AND storage_provider = 'pocketbase'`,
          [
            storage.bucket,
            objectKey,
            new URL(`/api/media/${row.id}`, canonicalAppUrl).toString(),
            bytes.length,
            detected.mime,
            row.id,
          ],
        )

        if (updated.rowCount !== 1) {
          throw new Error(`Legacy row changed during migration for ${row.id}`)
        }

        await coordinator.query(
          `INSERT INTO media_objects (
             id, provider, object_key, filename, original_filename, mime_type,
             size_bytes, checksum_sha256, visibility, status, created_at, updated_at
           ) VALUES (
             $1, 'garage', $2, $3, $4, $5, $6, $7,
             'PUBLIC', 'READY', $8, NOW()
           )
           ON CONFLICT (id) DO UPDATE SET
             provider = EXCLUDED.provider,
             object_key = EXCLUDED.object_key,
             filename = EXCLUDED.filename,
             original_filename = EXCLUDED.original_filename,
             mime_type = EXCLUDED.mime_type,
             size_bytes = EXCLUDED.size_bytes,
             checksum_sha256 = EXCLUDED.checksum_sha256,
             visibility = EXCLUDED.visibility,
             status = EXCLUDED.status,
             updated_at = NOW()`,
          [
            row.id,
            objectKey,
            boundedText(row.name, 255) || 'legacy-object',
            boundedText(row.original_name || row.name, 255) || 'legacy-object',
            detected.mime,
            bytes.length,
            checksumHex,
            row.created_at || row.uploaded_at || new Date(),
          ],
        )

        await coordinator.query(
          `INSERT INTO audit_events (
             id, action, entity_type, entity_id, metadata, created_at
           ) VALUES (
             gen_random_uuid(), 'media.migrated', 'MediaObject', $1,
             $2::jsonb, NOW()
           )`,
          [row.id, JSON.stringify({from: 'pocketbase', to: 'garage'})],
        )
        await coordinator.query(
          `UPDATE instagram_posts
              SET media_object_id = $1,
                  updated_at = NOW()
            WHERE uploaded_file_id = $1`,
          [row.id],
        )
        await coordinator.query('COMMIT')
      } catch (error) {
        await coordinator.query('ROLLBACK').catch(() => undefined)
        await storage.client
          .send(
            new DeleteObjectCommand({
              Bucket: storage.bucket,
              Key: objectKey,
            }),
          )
          .catch(() => console.error(`Garage cleanup failed for ${row.id}`))
        throw error
      }

      migrated += 1
      process.stdout.write(`${JSON.stringify({migrated, total: legacy.rowCount})}\n`)
    }
  }
} finally {
  await coordinator
    .query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID])
    .catch(() => undefined)
  coordinator.release()
  await database.end()
  storage?.client.destroy()
}
