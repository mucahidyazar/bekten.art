import {randomUUID} from 'crypto'

import {NextResponse} from 'next/server'

import {prisma} from '@/lib/db'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {
  createConfiguredS3Client,
  createS3ObjectStorage,
  parseObjectStorageConfiguration,
} from '@/server/storage/object-storage'
import {
  MAX_UPLOAD_BYTES,
  prepareImageUpload,
  validateMediaId,
  validateStorageObjectKey,
  validateStoragePathSegment,
} from '@/server/storage/upload-validation'
import {
  requireStudioEditor,
  requireStudioOwner,
} from '@/server/studio-auth/configured-access'
import {
  StudioAuthenticationRequiredError,
  StudioEditorRequiredError,
  StudioOwnerRequiredError,
} from '@/server/studio-auth/roles'

const MAX_MULTIPART_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024
const MAX_LIST_LIMIT = 100

class StorageUnavailableError extends Error {
  constructor() {
    super('Media storage is temporarily unavailable')
    this.name = 'StorageUnavailableError'
  }
}

function getObjectStorage() {
  const configuration = parseObjectStorageConfiguration()

  return {
    configuration,
    storage: createS3ObjectStorage({
      bucket: configuration.bucket,
      client: createConfiguredS3Client(configuration),
    }),
  }
}

function publicMediaUrl(id: string) {
  const baseUrl = canonicalAppUrl()

  if (!baseUrl) {
    throw new Error('Application URL is not configured')
  }

  return new URL(`/api/media/${id}`, baseUrl).toString()
}

function canonicalAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    ''
  )
}

function mutationOriginError(request: Request) {
  const appUrl = canonicalAppUrl()

  if (!appUrl) {
    console.error('Upload API application URL is not configured')

    return NextResponse.json({error: 'Unable to process media'}, {status: 500})
  }

  if (!isSameOriginMutation(request, appUrl)) {
    return NextResponse.json(
      {error: 'Request origin is not allowed'},
      {status: 403},
    )
  }

  return null
}

function optionalExternalUrl(candidate: string) {
  if (!candidate) {
    return null
  }

  try {
    const parsed = new URL(candidate)

    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      !parsed.username &&
      !parsed.password
      ? parsed.toString().slice(0, 2048)
      : null
  } catch {
    return null
  }
}

function requestError(error: unknown) {
  if (error instanceof StudioAuthenticationRequiredError) {
    return {message: 'Authentication required', status: 401}
  }

  if (error instanceof StudioEditorRequiredError) {
    return {message: 'Studio editor access required', status: 403}
  }

  if (error instanceof StudioOwnerRequiredError) {
    return {message: 'Studio owner access required', status: 403}
  }

  if (error instanceof StorageUnavailableError) {
    return {message: error.message, status: 503}
  }

  const code = error instanceof Error ? error.message : ''

  if (
    code === 'UPLOAD_FILE_TOO_LARGE' ||
    code === 'UPLOAD_TRANSFORMED_TOO_LARGE'
  ) {
    return {message: 'File is too large', status: 413}
  }

  if (code === 'UPLOAD_FILE_TYPE_INVALID' || code === 'UPLOAD_IMAGE_INVALID') {
    return {message: 'Invalid image upload', status: 415}
  }

  if (
    code === 'UPLOAD_FILE_EMPTY' ||
    code === 'UPLOAD_PATH_INVALID' ||
    code === 'MEDIA_ID_INVALID'
  ) {
    return {message: 'Invalid media request', status: 400}
  }

  return {message: 'Unable to process media', status: 500}
}

function errorResponse(error: unknown) {
  const response = requestError(error)

  if (response.status >= 500) {
    console.error('Media request failed')
  }

  return NextResponse.json({error: response.message}, {status: response.status})
}

function validMultipartMetadata(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  const rawLength = request.headers.get('content-length')
  const contentLength = rawLength ? Number(rawLength) : null

  return (
    contentType.toLowerCase().startsWith('multipart/form-data;') &&
    contentLength !== null &&
    Number.isSafeInteger(contentLength) &&
    contentLength >= 0 &&
    contentLength <= MAX_MULTIPART_BYTES
  )
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    value !== null &&
    typeof value !== 'string' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.name === 'string' &&
    Number.isSafeInteger(value.size) &&
    value.size >= 0 &&
    typeof value.type === 'string'
  )
}

async function markMediaFailed(id: string) {
  await prisma.mediaObject
    .update({data: {status: 'FAILED'}, where: {id}})
    .catch(() => console.error('Unable to mark failed media upload'))
}

export async function DELETE(request: Request) {
  const originError = mutationOriginError(request)

  if (originError) {
    return originError
  }

  try {
    const owner = await requireStudioOwner()

    const {searchParams} = new URL(request.url)
    const fileId = validateMediaId(searchParams.get('id') || '')

    const media = await prisma.mediaObject.findUnique({where: {id: fileId}})

    if (!media) {
      return NextResponse.json({error: 'File not found'}, {status: 404})
    }

    const managedByGarage = media.provider === 'garage'
    const objectKey = media.objectKey

    if (!managedByGarage || !objectKey) {
      return NextResponse.json({error: 'File not found'}, {status: 404})
    }

    const safeObjectKey = validateStorageObjectKey(objectKey)

    await prisma.mediaObject.update({
      data: {status: 'FAILED'},
      where: {id: fileId},
    })

    try {
      await getObjectStorage().storage.delete(safeObjectKey)
    } catch {
      throw new StorageUnavailableError()
    }

    await prisma.$transaction(async transaction => {
      await transaction.mediaObject.deleteMany({where: {id: fileId}})
      await transaction.auditEvent.create({
        data: {
          action: 'media.deleted',
          actorUserId: owner.id,
          entityId: fileId,
          entityType: 'MediaObject',
          metadata: {objectKey: safeObjectKey},
        },
      })
    })

    return NextResponse.json({success: true})
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(request: Request) {
  try {
    await requireStudioEditor()

    const {searchParams} = new URL(request.url)
    const bucket = validateStoragePathSegment(
      searchParams.get('bucket') || 'images',
    )
    const folderCandidate = searchParams.get('folder')
    const folder = folderCandidate
      ? validateStoragePathSegment(folderCandidate)
      : null
    const rawLimit = searchParams.get('limit') || '50'
    const limit = Number(rawLimit)

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIST_LIMIT) {
      return NextResponse.json({error: 'Invalid list limit'}, {status: 400})
    }

    const cursorCandidate = searchParams.get('cursor')
    const cursor = cursorCandidate ? validateMediaId(cursorCandidate) : null

    const files = await prisma.mediaObject.findMany({
      ...(cursor ? {cursor: {id: cursor}, skip: 1} : {}),
      orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
      take: limit + 1,
      where: {
        provider: 'garage',
        status: 'READY',
        visibility: 'PUBLIC',
        ...(folder
          ? {
              objectKey: {
                startsWith: `${folder}/`,
              },
            }
          : {}),
      },
    })
    const page = files.slice(0, limit)

    return NextResponse.json({
      files: page.map(file => ({
        bucket,
        id: file.id,
        name: file.filename,
        path: file.objectKey,
        size: file.sizeBytes,
        type: file.mimeType,
        uploaded_at: file.createdAt.toISOString(),
        url: publicMediaUrl(file.id),
      })),
      nextCursor: files.length > limit ? page.at(-1)?.id || null : null,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  const originError = mutationOriginError(request)

  if (originError) {
    return originError
  }

  try {
    const editor = await requireStudioEditor()

    if (!validMultipartMetadata(request)) {
      return NextResponse.json({error: 'Invalid upload request'}, {status: 400})
    }

    const formData = await request.formData()
    const bucket = validateStoragePathSegment(
      String(formData.get('bucket') || 'images'),
    )
    const folder = validateStoragePathSegment(
      String(formData.get('folder') || 'gallery'),
    )
    const sourceUrl = optionalExternalUrl(
      String(formData.get('sourceUrl') || ''),
    )
    const file = formData.get('file')

    if (!isUploadedFile(file)) {
      return NextResponse.json({error: 'File is required'}, {status: 400})
    }

    const prepared = await prepareImageUpload({file, folder})
    const {storage} = getObjectStorage()
    const id = randomUUID()

    await prisma.mediaObject.create({
      data: {
        checksumSha256: prepared.checksumSha256Hex,
        filename: prepared.objectKey.split('/').at(-1) || `${id}.webp`,
        height: prepared.height,
        id,
        mimeType: prepared.contentType,
        objectKey: prepared.objectKey,
        originalFilename: prepared.originalFileName,
        provider: 'garage',
        sizeBytes: prepared.bytes.byteLength,
        status: 'UPLOADING',
        uploadedByUserId: editor.id,
        visibility: 'PUBLIC',
        width: prepared.width,
      },
    })

    try {
      await storage.write(prepared)
    } catch {
      await markMediaFailed(id)
      throw new StorageUnavailableError()
    }

    let savedFile

    try {
      savedFile = await prisma.$transaction(async transaction => {
        const media = await transaction.mediaObject.update({
          data: {status: 'READY'},
          where: {id, status: 'UPLOADING'},
        })

        await transaction.auditEvent.create({
          data: {
            action: 'media.uploaded',
            actorUserId: editor.id,
            entityId: id,
            entityType: 'MediaObject',
            metadata: {
              bucket,
              contentType: prepared.contentType,
              sizeBytes: prepared.bytes.byteLength,
              sourceUrl,
            },
          },
        })

        return media
      })
    } catch (error) {
      await storage
        .delete(prepared.objectKey)
        .catch(() => console.error('Upload storage compensation failed'))
      await markMediaFailed(id)
      throw error
    }

    return NextResponse.json({
      file: {
        bucket,
        id: savedFile.id,
        name: savedFile.filename,
        path: savedFile.objectKey,
        size: savedFile.sizeBytes,
        type: savedFile.mimeType,
        uploaded_at: savedFile.createdAt.toISOString(),
        url: publicMediaUrl(savedFile.id),
      },
      success: true,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export const dynamic = 'force-dynamic'
