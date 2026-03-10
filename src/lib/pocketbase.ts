const DEFAULT_COLLECTION = 'shared_uploads'
const DEFAULT_APP_KEY = 'bekten-art'

let cachedToken:
  | {
      expiresAt: number
      token: string
    }
  | undefined

function getPocketBaseBaseUrl() {
  const rawUrl = process.env.POCKETBASE_URL || ''

  return rawUrl.replace(/\/_\/?$/, '').replace(/\/$/, '')
}

function getStorageCollection() {
  return process.env.POCKETBASE_STORAGE_COLLECTION || DEFAULT_COLLECTION
}

async function getAdminToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const baseUrl = getPocketBaseBaseUrl()
  const identity = process.env.POCKETBASE_ADMIN_EMAIL
  const password = process.env.POCKETBASE_ADMIN_PASSWORD

  if (!baseUrl || !identity || !password) {
    throw new Error('PocketBase admin credentials are not configured')
  }

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
    throw new Error('PocketBase admin authentication failed')
  }

  const payload = (await response.json()) as {token: string}

  cachedToken = {
    expiresAt: Date.now() + 45 * 60 * 1000,
    token: payload.token,
  }

  return payload.token
}

function buildFileUrl(recordId: string, fileName: string) {
  return `${getPocketBaseBaseUrl()}/api/files/${getStorageCollection()}/${recordId}/${fileName}`
}

export async function deleteSharedMedia(recordId: string) {
  const token = await getAdminToken()

  const response = await fetch(
    `${getPocketBaseBaseUrl()}/api/collections/${getStorageCollection()}/records/${recordId}`,
    {
      headers: {
        Authorization: token,
      },
      method: 'DELETE',
    },
  )

  if (!response.ok && response.status !== 404) {
    const payload = await response.text()

    throw new Error(`PocketBase delete failed: ${payload}`)
  }
}

export async function uploadSharedMedia({
  appKey = DEFAULT_APP_KEY,
  bucketName,
  file,
  filePath,
  folder,
  originalName,
  sourceUrl,
}: {
  appKey?: string
  bucketName: string
  file: File
  filePath: string
  folder: string
  originalName: string
  sourceUrl?: string
}) {
  const token = await getAdminToken()
  const formData = new FormData()

  formData.set('app_key', appKey)
  formData.set('bucket_name', bucketName)
  formData.set('file_path', filePath)
  formData.set('folder', folder)
  formData.set('original_name', originalName)
  formData.set('file_size', String(file.size))
  formData.set('file_type', file.type)
  formData.set('source_url', sourceUrl || '')
  formData.set('file', file)

  const response = await fetch(
    `${getPocketBaseBaseUrl()}/api/collections/${getStorageCollection()}/records`,
    {
      body: formData,
      headers: {
        Authorization: token,
      },
      method: 'POST',
    },
  )

  if (!response.ok) {
    const payload = await response.text()

    throw new Error(`PocketBase upload failed: ${payload}`)
  }

  const payload = (await response.json()) as {
    collectionName: string
    file?: string
    id: string
  }
  const fileName = payload.file || file.name

  return {
    app_key: appKey,
    bucket_name: bucketName,
    public_url: buildFileUrl(payload.id, fileName),
    storage_collection: payload.collectionName,
    storage_record_id: payload.id,
  }
}
