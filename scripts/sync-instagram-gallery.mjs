import {existsSync, readFileSync} from 'fs'
import {createHash, randomUUID} from 'node:crypto'
import {dirname, resolve} from 'path'
import {fileURLToPath, pathToFileURL} from 'url'

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'
import {fileTypeFromBuffer} from 'file-type'
import sharp from 'sharp'

import {
  boundedBodyBytes,
  boundedText,
  normalizeActorId,
  normalizeInstagramUsername,
  validateInstagramImageUrl,
  validateResultsLimit,
} from './media-safety.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = resolve(__dirname, '..')
const DEFAULT_ACTOR_ID = 'apify/instagram-api-scraper'
const DEFAULT_USERNAME = 'bekten_usubaliev'
const DEFAULT_RESULTS_LIMIT = 60
const DEFAULT_FOLDER = 'instagram'
const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const MAX_APIFY_RESPONSE_BYTES = 10 * 1024 * 1024
const RETRY_DELAYS_MS = Object.freeze([500, 1_500, 4_000])

function loadEnvFile() {
  const envPath = resolve(ROOT_DIR, '.env')

  if (!existsSync(envPath)) {
    return
  }

  const contents = readFileSync(envPath, 'utf8')

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()

    if (!key || process.env[key] !== undefined) {
      continue
    }

    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const normalizedValue =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue

    process.env[key] = normalizedValue
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

function sanitizeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/gu, '-').slice(0, 120)
}

async function createPrismaClient() {
  const connectionString = requireEnv('DATABASE_URL')

  return new PrismaClient({
    adapter: new PrismaPg({connectionString}),
    log: ['error'],
  })
}

function createStorage() {
  const endpoint = new URL(requireEnv('MEDIA_S3_ENDPOINT'))
  const bucket = requireEnv('MEDIA_S3_BUCKET')

  if (
    endpoint.protocol !== 'https:' ||
    endpoint.username ||
    endpoint.password ||
    endpoint.pathname !== '/' ||
    endpoint.search ||
    endpoint.hash ||
    !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u.test(bucket) ||
    bucket.includes('..') ||
    requireEnv('MEDIA_S3_FORCE_PATH_STYLE') !== 'true'
  ) {
    throw new Error('Garage storage configuration is invalid')
  }

  return Object.freeze({
    bucket,
    client: new S3Client({
      credentials: {
        accessKeyId: requireEnv('MEDIA_S3_ACCESS_KEY_ID'),
        secretAccessKey: requireEnv('MEDIA_S3_SECRET_ACCESS_KEY'),
      },
      endpoint: endpoint.toString(),
      forcePathStyle: true,
      region: requireEnv('MEDIA_S3_REGION'),
    }),
  })
}

async function fetchWithRetry(url, options, label) {
  let lastError
  const {timeoutMs, ...fetchOptions} = options

  for (const [attempt, delayMs] of [...RETRY_DELAYS_MS, 0].entries()) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return response
      }

      lastError = new Error(`${label} failed (${response.status})`)
    } catch (error) {
      lastError = error
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise(resolveDelay => setTimeout(resolveDelay, delayMs))
    }
  }

  throw new Error(`${label} failed after retries`, {cause: lastError})
}

async function fetchApifyPayload({actorId, resultsLimit, token, username}) {
  const body = actorId.includes('instagram-api-scraper')
    ? {
        directUrls: [`https://www.instagram.com/${username}/`],
        resultsLimit,
        resultsType: 'posts',
        searchType: 'user',
      }
    : {
        usernames: [username],
      }

  const response = await fetchWithRetry(
    `https://api.apify.com/v2/acts/${normalizeActorId(actorId)}/run-sync-get-dataset-items?timeout=180`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      timeoutMs: 195_000,
    },
    'Apify request',
  )

  if (!response.ok) {
    throw new Error(`Apify request failed (${response.status})`)
  }

  const declaredSize = Number(response.headers.get('content-length') || '0')

  if (declaredSize > MAX_APIFY_RESPONSE_BYTES) {
    throw new Error('Apify response exceeds the size limit')
  }

  let payload

  try {
    const bytes = await boundedBodyBytes(
      response.body,
      MAX_APIFY_RESPONSE_BYTES,
    )

    payload = JSON.parse(bytes.toString('utf8'))
  } catch (error) {
    throw new Error('Apify returned an invalid response', {cause: error})
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Apify returned no Instagram profile data')
  }

  return payload
}

function safeInstagramPermalink(value, shortCode) {
  try {
    const parsed = new URL(value)

    if (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'instagram.com' ||
        parsed.hostname === 'www.instagram.com') &&
      !parsed.username &&
      !parsed.password
    ) {
      return parsed.toString()
    }
  } catch {
    // Fall back to a permalink constructed from the validated shortcode.
  }

  return `https://www.instagram.com/p/${encodeURIComponent(shortCode)}/`
}

function safeTimestamp(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizedOwnerUsername(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  try {
    return normalizeInstagramUsername(value)
  } catch {
    return null
  }
}

export function normalizePosts(payload, username, resultsLimit) {
  const normalizedUsername = normalizeInstagramUsername(username)
  const posts = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.latestPosts)
      ? payload.latestPosts
      : []
  const seenIds = new Set()

  const normalizedPosts = []

  for (const post of posts) {
    const id = boundedText(post?.id, 160)
    const shortCode = boundedText(post?.shortCode, 80)
    const ownerUsername = normalizedOwnerUsername(post?.ownerUsername)

    if (
      !id ||
      !shortCode ||
      seenIds.has(id) ||
      (ownerUsername && ownerUsername !== normalizedUsername)
    ) {
      continue
    }

    let displayUrl

    try {
      displayUrl = validateInstagramImageUrl(post?.displayUrl).toString()
    } catch {
      continue
    }

    seenIds.add(id)

    const caption = boundedText(post.caption, 10_000)
    const alt = boundedText(post.alt, 2_000)
    const mediaType = boundedText(post.type, 32) || 'Image'
    const permalink = safeInstagramPermalink(post.url, shortCode)
    const timestamp = safeTimestamp(post.timestamp)

    normalizedPosts.push(
      Object.freeze({
        alt,
        caption,
        displayUrl,
        id,
        isPinned: Boolean(post.isPinned),
        ownerUsername,
        rawPayload: {
          alt,
          caption,
          displayUrl,
          id,
          isPinned: Boolean(post.isPinned),
          mediaType,
          ownerUsername,
          permalink,
          shortCode,
          timestamp: timestamp?.toISOString() || null,
        },
        shortCode,
        timestamp,
        type: mediaType,
        url: permalink,
      }),
    )

    if (normalizedPosts.length >= resultsLimit) {
      break
    }
  }

  return normalizedPosts
}

async function downloadImage(url, fileBaseName) {
  const parsedUrl = validateInstagramImageUrl(url)

  const response = await fetchWithRetry(
    parsedUrl,
    {headers: {Accept: 'image/*'}, redirect: 'error', timeoutMs: 20_000},
    'Instagram image download',
  )

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status}`)
  }

  const declaredSize = Number(response.headers.get('content-length') || '0')

  if (declaredSize > MAX_IMAGE_BYTES) {
    throw new Error('Instagram image exceeds the size limit')
  }

  const source = await boundedBodyBytes(response.body, MAX_IMAGE_BYTES)

  if (source.byteLength < 1 || source.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('Instagram image size is invalid')
  }

  const detected = await fileTypeFromBuffer(source)

  if (!detected || !['image/jpeg', 'image/png', 'image/webp'].includes(detected.mime)) {
    throw new Error('Instagram response is not a supported image')
  }

  const transformed = await sharp(source, {
    animated: false,
    failOn: 'warning',
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      fit: 'inside',
      height: 4096,
      width: 4096,
      withoutEnlargement: true,
    })
    .webp({effort: 5, quality: 88, smartSubsample: true})
    .toBuffer({resolveWithObject: true})
  const checksumBase64 = createHash('sha256')
    .update(transformed.data)
    .digest('base64')
  const checksumHex = createHash('sha256')
    .update(transformed.data)
    .digest('hex')

  return {
    bytes: transformed.data,
    checksumBase64,
    checksumHex,
    contentType: 'image/webp',
    fileName: `${fileBaseName}.webp`,
    height: transformed.info.height,
    size: transformed.data.byteLength,
    width: transformed.info.width,
  }
}

async function uploadImageToGarage({download, filePath, storage}) {
  await storage.client.send(
    new PutObjectCommand({
      Body: download.bytes,
      Bucket: storage.bucket,
      CacheControl: 'public, max-age=31536000, immutable, no-transform',
      ChecksumSHA256: download.checksumBase64,
      ContentLength: download.size,
      ContentType: download.contentType,
      Key: filePath,
      Metadata: {sha256: download.checksumBase64},
    }),
  )
}

async function ensureMediaObject({post, prisma, storage}) {
  const existingPost = await prisma.instagramPost.findUnique({
    include: {
      media_object: true,
    },
    where: {
      instagram_media_id: post.id,
    },
  })

  if (
    existingPost?.media_object?.provider === 'garage' &&
    existingPost.media_object.status === 'READY'
  ) {
    return existingPost.media_object
  }

  const fileBaseName = sanitizeFileName(post.shortCode)
  const objectPrefix = sanitizeFileName(post.id)
  const filePath = `${DEFAULT_FOLDER}/${objectPrefix}-${fileBaseName}.webp`
  const existingMedia = await prisma.mediaObject.findUnique({
    where: {objectKey: filePath},
  })

  if (existingMedia?.provider === 'garage' && existingMedia.status === 'READY') {
    return existingMedia
  }

  const download = await downloadImage(post.displayUrl, fileBaseName)
  const provisionalId = randomUUID()
  const media = await prisma.mediaObject.upsert({
    create: {
      checksumSha256: download.checksumHex,
      filename: download.fileName,
      height: download.height,
      id: provisionalId,
      mimeType: download.contentType,
      objectKey: filePath,
      originalFilename: download.fileName,
      provider: 'garage',
      sizeBytes: download.size,
      status: 'UPLOADING',
      visibility: 'PUBLIC',
      width: download.width,
    },
    update: {
      checksumSha256: download.checksumHex,
      filename: download.fileName,
      height: download.height,
      mimeType: download.contentType,
      originalFilename: download.fileName,
      provider: 'garage',
      sizeBytes: download.size,
      status: 'UPLOADING',
      visibility: 'PUBLIC',
      width: download.width,
    },
    where: {objectKey: filePath},
  })
  const id = media.id

  try {
    await uploadImageToGarage({download, filePath, storage})
  } catch (error) {
    await prisma.mediaObject
      .update({data: {status: 'FAILED'}, where: {id}})
      .catch(() => undefined)
    throw error
  }

  try {
    return await prisma.$transaction(async transaction => {
      await transaction.mediaObject.update({
        data: {status: 'READY'},
        where: {id, status: 'UPLOADING'},
      })

      await transaction.auditEvent.create({
        data: {
          action: 'media.instagram_synced',
          entityId: id,
          entityType: 'MediaObject',
          metadata: {instagramMediaId: post.id, shortcode: post.shortCode},
        },
      })

      return transaction.mediaObject.findUniqueOrThrow({where: {id}})
    })
  } catch (error) {
    await storage.client
      .send(new DeleteObjectCommand({Bucket: storage.bucket, Key: filePath}))
      .catch(() => console.error(`Garage cleanup failed for ${post.shortCode}`))
    await prisma.mediaObject
      .update({data: {status: 'FAILED'}, where: {id}})
      .catch(() => undefined)
    throw error
  }
}

async function main() {
  loadEnvFile()

  const actorId = process.env.APIFY_ACTOR_ID?.trim() || DEFAULT_ACTOR_ID
  const resultsLimit = validateResultsLimit(
    process.env.APIFY_RESULTS_LIMIT?.trim() || String(DEFAULT_RESULTS_LIMIT),
  )
  const token = requireEnv('APIFY_TOKEN')
  const username =
    process.env.APIFY_INSTAGRAM_USERNAME?.trim() || DEFAULT_USERNAME
  const normalizedUsername = normalizeInstagramUsername(username)
  const prisma = await createPrismaClient()
  const storage = createStorage()
  const now = new Date()

  try {
    const payload = await fetchApifyPayload({
      actorId,
      resultsLimit,
      token,
      username: normalizedUsername,
    })
    const posts = normalizePosts(payload, username, resultsLimit)

    if (posts.length === 0) {
      throw new Error('Apify returned no valid Instagram posts')
    }
    const existingPosts = await prisma.instagramPost.findMany({
      orderBy: [
        {display_order: 'asc'},
        {posted_at: 'desc'},
        {created_at: 'desc'},
      ],
      select: {
        id: true,
      },
      where: {
        is_active: true,
      },
    })
    const touchedIds = new Set()
    let created = 0
    let skipped = 0
    let updated = 0

    for (const [index, post] of posts.entries()) {
      try {
        const existing = await prisma.instagramPost.findUnique({
          where: {
            instagram_media_id: post.id,
          },
        })
        const mediaObject = await ensureMediaObject({
          post,
          prisma,
          storage,
        })
        const record = await prisma.instagramPost.upsert({
          create: {
            alt_text: post.alt || null,
            caption: post.caption || null,
            display_order: index,
            instagram_media_id: post.id,
            is_active: true,
            is_pinned: Boolean(post.isPinned),
            media_type: post.type || 'Image',
            owner_username: post.ownerUsername || null,
            posted_at: post.timestamp,
            raw_payload: post.rawPayload,
            shortcode: post.shortCode,
            source_display_url: post.displayUrl,
            source_permalink: post.url,
            synced_at: now,
            thumbnail_url: post.displayUrl,
            media_object_id: mediaObject.id,
            username: normalizedUsername,
          },
          update: {
            alt_text: post.alt || null,
            caption: post.caption || null,
            display_order: index,
            is_active: true,
            is_pinned: Boolean(post.isPinned),
            media_type: post.type || 'Image',
            owner_username: post.ownerUsername || null,
            posted_at: post.timestamp,
            raw_payload: post.rawPayload,
            source_display_url: post.displayUrl,
            source_permalink: post.url,
            synced_at: now,
            thumbnail_url: post.displayUrl,
            media_object_id: mediaObject.id,
            username: normalizedUsername,
          },
          where: {
            instagram_media_id: post.id,
          },
        })

        touchedIds.add(record.id)

        if (existing) {
          updated += 1
        } else {
          created += 1
        }
      } catch (error) {
        skipped += 1
        console.warn(
          `Skipping Instagram post ${post.shortCode}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    }

    const untouchedPosts = existingPosts.filter(
      post => !touchedIds.has(post.id),
    )

    if (created + updated === 0) {
      throw new Error('Instagram sync did not persist any posts')
    }

    for (const [offset, post] of untouchedPosts.entries()) {
      await prisma.instagramPost.update({
        data: {
          display_order: posts.length + offset,
          synced_at: now,
        },
        where: {
          id: post.id,
        },
      })
    }

    console.log(
      JSON.stringify(
        {
          actorId,
          created,
          fetched: posts.length,
          resultsLimit,
          skipped,
          untouchedReordered: untouchedPosts.length,
          updated,
          username: normalizedUsername,
        },
        null,
        2,
      ),
    )
  } finally {
    storage.client.destroy()
    await prisma.$disconnect()
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''

if (import.meta.url === invokedPath) {
  main().catch(error => {
    console.error(
      error instanceof Error ? error.message : 'Instagram gallery sync failed',
    )
    process.exitCode = 1
  })
}
