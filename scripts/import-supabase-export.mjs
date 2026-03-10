import {randomUUID} from 'node:crypto'
import {readFile, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'

import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

let prisma

const EXPORT_DIR =
  process.env.SUPABASE_EXPORT_DIR ||
  path.resolve(process.cwd(), '../supabase-export-vbxzmrlrwdxbmlcbitrq')
const APP_KEY = 'bekten-art'
const STORAGE_COLLECTION =
  process.env.POCKETBASE_STORAGE_COLLECTION || 'shared_uploads'

async function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env')
  const raw = await readFile(envPath, 'utf8')

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const [key, ...rest] = trimmed.split('=')

    if (process.env[key] !== undefined) {
      continue
    }

    process.env[key] = rest.join('=').replace(/^"/, '').replace(/"$/, '')
  }
}

function toDate(value) {
  return value ? new Date(value) : null
}

async function readNdjson(filePath) {
  const raw = await readFile(filePath, 'utf8')

  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line))
}

function getExportPath(...segments) {
  return path.join(EXPORT_DIR, ...segments)
}

function normalizeBaseUrl(url) {
  return String(url || '')
    .replace(/\/_\/?$/, '')
    .replace(/\/$/, '')
}

let cachedPocketBaseToken

async function getPocketBaseToken() {
  if (
    cachedPocketBaseToken &&
    cachedPocketBaseToken.expiresAt > Date.now()
  ) {
    return cachedPocketBaseToken.token
  }

  const baseUrl = normalizeBaseUrl(process.env.POCKETBASE_URL)
  const identity = process.env.POCKETBASE_ADMIN_EMAIL
  const password = process.env.POCKETBASE_ADMIN_PASSWORD

  if (!baseUrl || !identity || !password) {
    return null
  }

  const response = await fetch(
    `${baseUrl}/api/collections/_superusers/auth-with-password`,
    {
      body: JSON.stringify({identity, password}),
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
    },
  )

  if (!response.ok) {
    throw new Error('PocketBase admin authentication failed during import')
  }

  const payload = await response.json()

  cachedPocketBaseToken = {
    expiresAt: Date.now() + 45 * 60 * 1000,
    token: payload.token,
  }

  return cachedPocketBaseToken.token
}

async function uploadExportedFileToPocketBase(metadata) {
  const token = await getPocketBaseToken()

  if (!token) {
    return null
  }

  const localPath = getExportPath('storage', metadata.bucket_name, metadata.file_path)

  try {
    await stat(localPath)
  } catch {
    return null
  }

  const fileBuffer = await readFile(localPath)
  const extension = path.extname(metadata.file_path)
  const fileName = extension
    ? `${Date.now()}-${randomUUID()}${extension}`
    : `${Date.now()}-${randomUUID()}`
  const file = new File([fileBuffer], fileName, {
    type: metadata.file_type,
  })
  const formData = new FormData()

  formData.set('app_key', APP_KEY)
  formData.set('bucket_name', metadata.bucket_name)
  formData.set('file_path', metadata.file_path)
  formData.set('folder', metadata.file_path.split('/').slice(0, -1).join('/'))
  formData.set('original_name', metadata.original_name)
  formData.set('file_size', String(metadata.file_size))
  formData.set('file_type', metadata.file_type)
  formData.set('source_url', metadata.public_url)
  formData.set('file', file)

  const baseUrl = normalizeBaseUrl(process.env.POCKETBASE_URL)
  const response = await fetch(
    `${baseUrl}/api/collections/${STORAGE_COLLECTION}/records`,
    {
      body: formData,
      headers: {Authorization: token},
      method: 'POST',
    },
  )

  if (!response.ok) {
    const payload = await response.text()

    throw new Error(`PocketBase upload failed for ${metadata.file_path}: ${payload}`)
  }

  const payload = await response.json()
  const uploadedName = payload.file || fileName

  return {
    public_url: `${baseUrl}/api/files/${STORAGE_COLLECTION}/${payload.id}/${uploadedName}`,
    storage_collection: payload.collectionName || STORAGE_COLLECTION,
    storage_provider: 'pocketbase',
    storage_record_id: payload.id,
  }
}

function mapRole(value) {
  return value === 'ADMIN' || value === 'ARTIST' ? value : 'USER'
}

async function main() {
  await loadEnvFile()
  prisma = new PrismaClient({
    adapter: new PrismaPg({connectionString: process.env.DATABASE_URL}),
  })

  const report = {
    accounts: 0,
    files: 0,
    sections: 0,
    sectionData: 0,
    skippedFiles: 0,
    socials: 0,
    users: 0,
  }

  const publicUsers = await readNdjson(getExportPath('database', 'tables', 'users.ndjson'))
  const authUsers = await readNdjson(
    getExportPath('postgres-direct', 'tables', 'auth', 'users.ndjson'),
  )
  const authIdentities = await readNdjson(
    getExportPath('postgres-direct', 'tables', 'auth', 'identities.ndjson'),
  )
  const socials = await readNdjson(getExportPath('database', 'tables', 'socials.ndjson'))
  const sections = await readNdjson(getExportPath('database', 'tables', 'sections.ndjson'))
  const sectionData = await readNdjson(
    getExportPath('database', 'tables', 'section_data.ndjson'),
  )
  const uploadedFiles = await readNdjson(
    getExportPath('database', 'tables', 'uploaded_files.ndjson'),
  )

  const authUsersById = new Map(authUsers.map(user => [user.id, user]))
  const publicUsersById = new Map(publicUsers.map(user => [user.id, user]))
  const identitiesByUserId = authIdentities.reduce((acc, identity) => {
    const current = acc.get(identity.user_id) || []

    current.push(identity)
    acc.set(identity.user_id, current)

    return acc
  }, new Map())

  for (const user of publicUsers) {
    const authUser = authUsersById.get(user.id)

    await prisma.user.upsert({
      where: {id: user.id},
      update: {
        address: user.address || null,
        artworks_count: user.artworks_count || 0,
        email: user.email,
        emailVerified: toDate(authUser?.email_confirmed_at || authUser?.confirmed_at),
        exhibitions_count: user.exhibitions_count || 0,
        image: user.image || null,
        last_sign_in_at: toDate(authUser?.last_sign_in_at),
        map_embed_url: user.map_embed_url || null,
        name: user.name || null,
        passwordHash: authUser?.encrypted_password || null,
        phone: user.phone || null,
        role: mapRole(user.role),
        working_hours: user.working_hours || null,
        years_experience: user.years_experience || 0,
      },
      create: {
        address: user.address || null,
        artworks_count: user.artworks_count || 0,
        created_at: toDate(user.created_at) || new Date(),
        email: user.email,
        emailVerified: toDate(authUser?.email_confirmed_at || authUser?.confirmed_at),
        exhibitions_count: user.exhibitions_count || 0,
        id: user.id,
        image: user.image || null,
        last_sign_in_at: toDate(authUser?.last_sign_in_at),
        map_embed_url: user.map_embed_url || null,
        name: user.name || null,
        passwordHash: authUser?.encrypted_password || null,
        phone: user.phone || null,
        role: mapRole(user.role),
        updated_at: toDate(user.updated_at) || new Date(),
        working_hours: user.working_hours || null,
        years_experience: user.years_experience || 0,
      },
    })

    report.users += 1
  }

  for (const authUser of authUsers) {
    if (publicUsersById.has(authUser.id)) {
      continue
    }

    const rawUserMeta = authUser.raw_user_meta_data || {}
    const fallbackName =
      rawUserMeta.full_name || rawUserMeta.name || authUser.email?.split('@')[0] || null
    const fallbackImage = rawUserMeta.avatar_url || rawUserMeta.picture || null

    await prisma.user.upsert({
      where: {id: authUser.id},
      update: {
        email: authUser.email,
        emailVerified: toDate(authUser.email_confirmed_at || authUser.confirmed_at),
        image: fallbackImage,
        last_sign_in_at: toDate(authUser.last_sign_in_at),
        name: fallbackName,
        passwordHash: authUser.encrypted_password || null,
        role: 'USER',
      },
      create: {
        created_at: toDate(authUser.created_at) || new Date(),
        email: authUser.email,
        emailVerified: toDate(authUser.email_confirmed_at || authUser.confirmed_at),
        id: authUser.id,
        image: fallbackImage,
        last_sign_in_at: toDate(authUser.last_sign_in_at),
        name: fallbackName,
        passwordHash: authUser.encrypted_password || null,
        role: 'USER',
        updated_at: toDate(authUser.updated_at) || new Date(),
      },
    })

    report.users += 1
  }

  for (const identity of authIdentities) {
    if (identity.provider !== 'google') {
      continue
    }

    const providerAccountId =
      identity.identity_data?.provider_id ||
      identity.identity_data?.sub ||
      identity.provider_id

    if (!providerAccountId) {
      continue
    }

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId,
        },
      },
      update: {
        type: 'oauth',
        userId: identity.user_id,
      },
      create: {
        provider: 'google',
        providerAccountId,
        type: 'oauth',
        userId: identity.user_id,
      },
    })

    report.accounts += 1
  }

  for (const social of socials) {
    await prisma.social.upsert({
      where: {id: social.id},
      update: {
        platform: social.platform,
        updated_at: toDate(social.updated_at) || new Date(),
        url: social.url,
        user_id: social.user_id,
      },
      create: {
        created_at: toDate(social.created_at) || new Date(),
        id: social.id,
        platform: social.platform,
        updated_at: toDate(social.updated_at) || new Date(),
        url: social.url,
        user_id: social.user_id,
      },
    })

    report.socials += 1
  }

  for (const section of sections) {
    await prisma.section.upsert({
      where: {section_type: section.section_type},
      update: {
        badge_text: section.badge_text,
        display_order: section.display_order,
        is_active: section.is_active,
        max_items: section.max_items,
        section_description: section.section_description,
        section_title: section.section_title,
        updated_at: toDate(section.updated_at) || new Date(),
      },
      create: {
        badge_text: section.badge_text,
        created_at: toDate(section.created_at) || new Date(),
        display_order: section.display_order,
        id: section.id,
        is_active: section.is_active,
        max_items: section.max_items,
        section_description: section.section_description,
        section_title: section.section_title,
        section_type: section.section_type,
        updated_at: toDate(section.updated_at) || new Date(),
      },
    })

    report.sections += 1
  }

  for (const item of sectionData) {
    await prisma.sectionData.upsert({
      where: {id: item.id},
      update: {
        data: item.data,
        is_active: item.is_active,
        order: item.order,
        section_type: item.section_type,
        updated_at: toDate(item.updated_at) || new Date(),
      },
      create: {
        created_at: toDate(item.created_at) || new Date(),
        data: item.data,
        id: item.id,
        is_active: item.is_active,
        order: item.order,
        section_type: item.section_type,
        updated_at: toDate(item.updated_at) || new Date(),
      },
    })

    report.sectionData += 1
  }

  for (const file of uploadedFiles) {
    const existingFile = await prisma.uploadedFile.findUnique({
      where: {id: file.id},
    })

    let storagePayload =
      existingFile?.storage_provider === 'pocketbase' &&
      existingFile.storage_record_id
        ? {
            public_url: existingFile.public_url,
            storage_collection: existingFile.storage_collection,
            storage_provider: existingFile.storage_provider,
            storage_record_id: existingFile.storage_record_id,
          }
        : null

    if (!storagePayload) {
      storagePayload = await uploadExportedFileToPocketBase(file)
    }

    await prisma.uploadedFile.upsert({
      where: {id: file.id},
      update: {
        app_key: APP_KEY,
        bucket_name: file.bucket_name,
        file_path: file.file_path,
        file_size: file.file_size,
        file_type: file.file_type,
        folder: file.file_path.split('/').slice(0, -1).join('/'),
        name: file.name,
        original_name: file.original_name,
        public_url: storagePayload?.public_url || file.public_url,
        source_url: file.public_url,
        storage_collection:
          storagePayload?.storage_collection || STORAGE_COLLECTION,
        storage_provider:
          storagePayload?.storage_provider || 'supabase-export',
        storage_record_id: storagePayload?.storage_record_id || null,
        uploaded_at: toDate(file.uploaded_at) || new Date(),
      },
      create: {
        app_key: APP_KEY,
        bucket_name: file.bucket_name,
        created_at: toDate(file.created_at) || new Date(),
        file_path: file.file_path,
        file_size: file.file_size,
        file_type: file.file_type,
        folder: file.file_path.split('/').slice(0, -1).join('/'),
        id: file.id,
        name: file.name,
        original_name: file.original_name,
        public_url: storagePayload?.public_url || file.public_url,
        source_url: file.public_url,
        storage_collection:
          storagePayload?.storage_collection || STORAGE_COLLECTION,
        storage_provider:
          storagePayload?.storage_provider || 'supabase-export',
        storage_record_id: storagePayload?.storage_record_id || null,
        updated_at: toDate(file.updated_at) || new Date(),
        uploaded_at: toDate(file.uploaded_at) || new Date(),
      },
    })

    if (!storagePayload) {
      report.skippedFiles += 1
    } else {
      report.files += 1
    }
  }

  const resetCandidates = authUsers
    .filter(user => user.encrypted_password && !user.email_confirmed_at)
    .map(user => ({
      email: user.email,
      id: user.id,
      note: 'Email exists with password hash but is not confirmed in source auth export.',
    }))

  const reportPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    'import-report.json',
  )

  await writeFile(
    reportPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        exportDir: EXPORT_DIR,
        identitiesByUser: Object.fromEntries(
          Array.from(identitiesByUserId.entries()).map(([userId, identities]) => [
            userId,
            identities.length,
          ]),
        ),
        report,
        resetCandidates,
      },
      null,
      2,
    ),
    'utf8',
  )

  console.log(JSON.stringify({report, reportPath}, null, 2))
}

main()
  .catch(async error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma?.$disconnect()
  })
