import {existsSync, readFileSync} from 'fs'
import {dirname, resolve} from 'path'
import {fileURLToPath} from 'url'

import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = resolve(__dirname, '..')
const DEFAULT_ACTOR_ID = 'apify/instagram-api-scraper'
const DEFAULT_USERNAME = 'bekten_usubaliev'
const DEFAULT_RESULTS_LIMIT = 60
const DEFAULT_APP_KEY = 'bekten-art'
const DEFAULT_BUCKET = 'images'
const DEFAULT_FOLDER = 'instagram'
const DEFAULT_STORAGE_COLLECTION = 'shared_uploads'

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

function normalizeActorId(actorId) {
  return actorId.replace('/', '~')
}

function normalizeUsername(value) {
  return value.trim().replace(/^@/, '').toLowerCase()
}

function sanitizeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function getExtensionFromValue(value) {
  const cleanValue = value.split('?')[0] || ''
  const match = cleanValue.match(/\.([a-zA-Z0-9]+)$/)

  return match ? match[1].toLowerCase() : ''
}

function getExtensionFromContentType(contentType) {
  if (contentType === 'image/png') {
    return 'png'
  }

  if (contentType === 'image/webp') {
    return 'webp'
  }

  if (contentType === 'image/gif') {
    return 'gif'
  }

  return 'jpg'
}

async function createPrismaClient() {
  const connectionString = requireEnv('DATABASE_URL')

  return new PrismaClient({
    adapter: new PrismaPg({connectionString}),
    log: ['error'],
  })
}

async function getPocketBaseAdminAuth() {
  const baseUrl = requireEnv('POCKETBASE_URL')
    .replace(/\/_\/?$/, '')
    .replace(/\/$/, '')
  const identity = requireEnv('POCKETBASE_ADMIN_EMAIL')
  const password = requireEnv('POCKETBASE_ADMIN_PASSWORD')

  const response = await fetch(
    `${baseUrl}/api/collections/_superusers/auth-with-password`,
    {
      body: JSON.stringify({identity, password}),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )

  if (!response.ok) {
    throw new Error(`PocketBase auth failed: ${await response.text()}`)
  }

  const payload = await response.json()

  return {
    baseUrl,
    token: payload.token,
  }
}

function buildPocketBaseFileUrl(
  baseUrl,
  storageCollection,
  recordId,
  fileName,
) {
  return `${baseUrl}/api/files/${storageCollection}/${recordId}/${fileName}`
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

  const response = await fetch(
    `https://api.apify.com/v2/acts/${normalizeActorId(actorId)}/run-sync-get-dataset-items?token=${token}&timeout=180`,
    {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )

  if (!response.ok) {
    throw new Error(`Apify request failed: ${await response.text()}`)
  }

  const payload = await response.json()

  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Apify returned no Instagram profile data')
  }

  return payload
}

function normalizePosts(payload, username) {
  const normalizedUsername = normalizeUsername(username)
  const posts = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.latestPosts)
      ? payload.latestPosts
      : []
  const seenIds = new Set()

  return posts.filter(post => {
    if (!post?.id || !post?.shortCode || !post?.displayUrl) {
      return false
    }

    if (seenIds.has(post.id)) {
      return false
    }

    seenIds.add(post.id)

    if (Array.isArray(payload)) {
      return true
    }

    return normalizeUsername(post.ownerUsername || '') === normalizedUsername
  })
}

async function downloadImage(url, fileBaseName) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const extension =
    getExtensionFromValue(url) || getExtensionFromContentType(contentType)
  const fileName = `${fileBaseName}.${extension}`
  const fileBuffer = Buffer.from(await response.arrayBuffer())

  return {
    contentType,
    extension,
    file: new File([fileBuffer], fileName, {type: contentType}),
    fileName,
    size: fileBuffer.byteLength,
  }
}

async function uploadImageToPocketBase({
  auth,
  file,
  filePath,
  originalName,
  sourceUrl,
}) {
  const storageCollection =
    process.env.POCKETBASE_STORAGE_COLLECTION || DEFAULT_STORAGE_COLLECTION
  const formData = new FormData()

  formData.set('app_key', DEFAULT_APP_KEY)
  formData.set('bucket_name', DEFAULT_BUCKET)
  formData.set('file_path', filePath)
  formData.set('folder', DEFAULT_FOLDER)
  formData.set('original_name', originalName)
  formData.set('file_size', String(file.size))
  formData.set('file_type', file.type)
  formData.set('source_url', sourceUrl)
  formData.set('file', file)

  const response = await fetch(
    `${auth.baseUrl}/api/collections/${storageCollection}/records`,
    {
      body: formData,
      headers: {
        Authorization: auth.token,
      },
      method: 'POST',
    },
  )

  if (!response.ok) {
    throw new Error(`PocketBase upload failed: ${await response.text()}`)
  }

  const payload = await response.json()
  const uploadedFileName = payload.file || file.name

  return {
    public_url: buildPocketBaseFileUrl(
      auth.baseUrl,
      storageCollection,
      payload.id,
      uploadedFileName,
    ),
    storage_collection: payload.collectionName,
    storage_record_id: payload.id,
  }
}

async function ensureUploadedFile({auth, post, prisma}) {
  const existingPost = await prisma.instagramPost.findUnique({
    include: {
      uploaded_file: true,
    },
    where: {
      instagram_media_id: post.id,
    },
  })

  if (existingPost?.uploaded_file) {
    return existingPost.uploaded_file
  }

  const fileBaseName = sanitizeFileName(post.shortCode)
  const possibleExistingUploads = await prisma.uploadedFile.findMany({
    take: 1,
    where: {
      file_path: {
        startsWith: `${DEFAULT_FOLDER}/${fileBaseName}.`,
      },
    },
  })

  if (possibleExistingUploads[0]) {
    return possibleExistingUploads[0]
  }

  const download = await downloadImage(post.displayUrl, fileBaseName)
  const filePath = `${DEFAULT_FOLDER}/${fileBaseName}.${download.extension}`
  const upload = await uploadImageToPocketBase({
    auth,
    file: download.file,
    filePath,
    originalName: download.fileName,
    sourceUrl: post.displayUrl,
  })

  return prisma.uploadedFile.create({
    data: {
      app_key: DEFAULT_APP_KEY,
      bucket_name: DEFAULT_BUCKET,
      file_path: filePath,
      file_size: download.size,
      file_type: download.contentType,
      folder: DEFAULT_FOLDER,
      name: download.fileName,
      original_name: download.fileName,
      public_url: upload.public_url,
      source_url: post.displayUrl,
      storage_collection: upload.storage_collection,
      storage_provider: 'pocketbase',
      storage_record_id: upload.storage_record_id,
      uploaded_at: new Date(),
    },
  })
}

async function main() {
  loadEnvFile()

  const actorId = process.env.APIFY_ACTOR_ID?.trim() || DEFAULT_ACTOR_ID
  const resultsLimit = Number.parseInt(
    process.env.APIFY_RESULTS_LIMIT?.trim() || String(DEFAULT_RESULTS_LIMIT),
    10,
  )
  const token = requireEnv('APIFY_TOKEN')
  const username =
    process.env.APIFY_INSTAGRAM_USERNAME?.trim() || DEFAULT_USERNAME
  const normalizedUsername = normalizeUsername(username)
  const prisma = await createPrismaClient()
  const auth = await getPocketBaseAdminAuth()
  const now = new Date()

  try {
    const payload = await fetchApifyPayload({
      actorId,
      resultsLimit,
      token,
      username,
    })
    const posts = normalizePosts(payload, username)
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
        const uploadedFile = await ensureUploadedFile({auth, post, prisma})
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
            posted_at: post.timestamp ? new Date(post.timestamp) : null,
            raw_payload: post,
            shortcode: post.shortCode,
            source_display_url: post.displayUrl,
            source_permalink: post.url,
            synced_at: now,
            thumbnail_url: post.displayUrl,
            uploaded_file_id: uploadedFile.id,
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
            posted_at: post.timestamp ? new Date(post.timestamp) : null,
            raw_payload: post,
            source_display_url: post.displayUrl,
            source_permalink: post.url,
            synced_at: now,
            thumbnail_url: post.displayUrl,
            uploaded_file_id: uploadedFile.id,
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
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.message : 'Instagram gallery sync failed',
  )
  process.exitCode = 1
})
