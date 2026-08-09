import {createHash, randomUUID} from 'node:crypto'

import {fileTypeFromBuffer} from 'file-type'
import sharp from 'sharp'

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const CANONICAL_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u

function sanitizeOriginalFileName(fileName: string) {
  const finalSegment = fileName.split(/[\\/]/u).at(-1) || ''
  const withoutControls = finalSegment
    .replace(/[\u0000-\u001f\u007f]/gu, '')
    .trim()
  const bounded = Array.from(withoutControls).slice(0, 255).join('')

  return bounded || 'upload'
}

export async function prepareImageUpload({
  file,
  folder,
}: Readonly<{
  file: File
  folder: string
}>) {
  if (file.size < 1) {
    throw new Error('UPLOAD_FILE_EMPTY')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('UPLOAD_FILE_TOO_LARGE')
  }

  const safeFolder = validateStoragePathSegment(folder)
  const sourceBytes = new Uint8Array(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(sourceBytes)

  if (
    !detected ||
    !ALLOWED_IMAGE_TYPES.has(detected.mime) ||
    (file.type && file.type !== detected.mime)
  ) {
    throw new Error('UPLOAD_FILE_TYPE_INVALID')
  }

  let output: Buffer
  let width: number
  let height: number

  try {
    const transformed = await sharp(sourceBytes, {
      animated: false,
      failOn: 'warning',
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({
        fit: 'inside',
        height: 4096,
        withoutEnlargement: true,
        width: 4096,
      })
      .webp({effort: 5, quality: 88, smartSubsample: true})
      .toBuffer({resolveWithObject: true})

    output = transformed.data
    width = transformed.info.width
    height = transformed.info.height
  } catch {
    throw new Error('UPLOAD_IMAGE_INVALID')
  }

  if (output.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error('UPLOAD_TRANSFORMED_TOO_LARGE')
  }

  const checksumSha256 = createHash('sha256').update(output).digest('base64')
  const checksumSha256Hex = createHash('sha256').update(output).digest('hex')

  return {
    bytes: new Uint8Array(output),
    checksumSha256,
    checksumSha256Hex,
    contentType: 'image/webp' as const,
    height,
    objectKey: `${safeFolder}/${randomUUID()}.webp`,
    originalFileName: sanitizeOriginalFileName(file.name),
    originalSize: file.size,
    width,
  }
}

export function validateMediaId(id: string) {
  if (!CANONICAL_UUID.test(id)) {
    throw new Error('MEDIA_ID_INVALID')
  }

  return id
}

export function validateStorageObjectKey(objectKey: string) {
  const segments = objectKey.split('/')
  const valid =
    objectKey.length >= 1 &&
    objectKey.length <= 1024 &&
    /^[A-Za-z0-9._/-]+$/u.test(objectKey) &&
    !objectKey.startsWith('/') &&
    !objectKey.endsWith('/') &&
    segments.every(segment => segment !== '' && segment !== '.' && segment !== '..')

  if (!valid) {
    throw new Error('STORAGE_OBJECT_KEY_INVALID')
  }

  return objectKey
}

export function validateStoragePathSegment(segment: string) {
  const normalized = segment.trim().toLowerCase()

  if (
    normalized.length < 1 ||
    normalized.length > 48 ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(normalized)
  ) {
    throw new Error('UPLOAD_PATH_INVALID')
  }

  return normalized
}
