'use client'

export type FileUploadOptions = {
  bucket?: string
  folder?: string
  maxSizeInMB?: number
  allowedTypes?: string[]
  overwrite?: boolean
}

export type UploadedFile = {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploaded_at: string
  bucket: string
  path: string
}

const DEFAULT_OPTIONS: Required<FileUploadOptions> = {
  bucket: 'images',
  folder: 'gallery',
  maxSizeInMB: 10,
  allowedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  overwrite: false,
}

export const deleteFile = async (fileId: string): Promise<void> => {
  const response = await fetch(`/api/uploads?id=${fileId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = (await response.json()) as {error?: string}

    throw new Error(payload.error || 'Delete failed')
  }
}

export const getThumbnailUrl = (
  originalUrl: string,
  width: number = 300,
  height: number = 300,
): string => {
  if (originalUrl.includes('/api/files/')) {
    return `${originalUrl}?thumb=${width}x${height}`
  }

  return originalUrl
}

export const getUploadedFiles = async (
  bucket: string = 'images',
  folder?: string,
): Promise<UploadedFile[]> => {
  const params = new URLSearchParams({bucket})

  if (folder) {
    params.set('folder', folder)
  }

  const response = await fetch(`/api/uploads?${params.toString()}`)

  if (!response.ok) {
    const payload = (await response.json()) as {error?: string}

    throw new Error(payload.error || 'Failed to fetch files')
  }

  const payload = (await response.json()) as {files: UploadedFile[]}

  return payload.files
}

export const uploadFile = async (
  file: File,
  options: FileUploadOptions = {},
): Promise<UploadedFile> => {
  const opts = {...DEFAULT_OPTIONS, ...options}

  if (file.size > opts.maxSizeInMB * 1024 * 1024) {
    throw new Error(`File size must be less than ${opts.maxSizeInMB}MB`)
  }

  if (!opts.allowedTypes.includes(file.type)) {
    throw new Error(
      `File type ${file.type} is not allowed. Allowed types: ${opts.allowedTypes.join(', ')}`,
    )
  }

  const formData = new FormData()

  formData.set('bucket', opts.bucket)
  formData.set('folder', opts.folder)
  formData.set('file', file)

  const response = await fetch('/api/uploads', {
    body: formData,
    method: 'POST',
  })

  const payload = (await response.json()) as {
    error?: string
    file?: UploadedFile
  }

  if (!response.ok || !payload.file) {
    throw new Error(payload.error || 'Upload failed')
  }

  return payload.file
}

export const uploadFiles = async (
  files: File[],
  options: FileUploadOptions = {},
): Promise<UploadedFile[]> => {
  const uploadedFiles = []

  for (const file of files) {
    uploadedFiles.push(await uploadFile(file, options))
  }

  return uploadedFiles
}

export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {method: 'HEAD'})
    const contentType = response.headers.get('content-type')

    return response.ok && contentType?.startsWith('image/') === true
  } catch {
    return false
  }
}
