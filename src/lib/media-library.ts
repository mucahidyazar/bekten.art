'use client'

export type FileUploadOptions = Readonly<{
  allowedTypes?: readonly string[]
  bucket?: string
  folder?: string
  maxSizeInMB?: number
}>

export type UploadedMedia = Readonly<{
  bucket: string
  id: string
  name: string
  path: string
  size: number
  type: string
  uploaded_at: string
  url: string
}>

const DEFAULT_OPTIONS = Object.freeze({
  allowedTypes: Object.freeze([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
  ]),
  bucket: 'images',
  folder: 'gallery',
  maxSizeInMB: 12,
})

async function responseError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as {error?: string}

  return new Error(payload.error || fallback)
}

export async function deleteMedia(fileId: string): Promise<void> {
  const response = await fetch(`/api/uploads?id=${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw await responseError(response, 'Delete failed')
  }
}

export async function listMedia(
  bucket = DEFAULT_OPTIONS.bucket,
  folder?: string,
): Promise<readonly UploadedMedia[]> {
  const params = new URLSearchParams({bucket})

  if (folder) {
    params.set('folder', folder)
  }

  const response = await fetch(`/api/uploads?${params.toString()}`)

  if (!response.ok) {
    throw await responseError(response, 'Failed to fetch files')
  }

  const payload = (await response.json()) as {files?: UploadedMedia[]}

  if (!Array.isArray(payload.files)) {
    throw new Error('Invalid media response')
  }

  return Object.freeze(payload.files.map(file => Object.freeze(file)))
}

export async function uploadMedia(
  file: File,
  options: FileUploadOptions = {},
): Promise<UploadedMedia> {
  const resolved = Object.freeze({...DEFAULT_OPTIONS, ...options})

  if (file.size > resolved.maxSizeInMB * 1024 * 1024) {
    throw new Error(`File size must be less than ${resolved.maxSizeInMB}MB`)
  }

  if (!resolved.allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP and AVIF images are accepted')
  }

  const formData = new FormData()

  formData.set('bucket', resolved.bucket)
  formData.set('folder', resolved.folder)
  formData.set('file', file)

  const response = await fetch('/api/uploads', {
    body: formData,
    method: 'POST',
  })

  if (!response.ok) {
    throw await responseError(response, 'Upload failed')
  }

  const payload = (await response.json()) as {file?: UploadedMedia}

  if (!payload.file) {
    throw new Error('Invalid media response')
  }

  return Object.freeze(payload.file)
}
