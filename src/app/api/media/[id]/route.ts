import {NextResponse} from 'next/server'

import {GetObjectCommand} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'

import {prisma} from '@/lib/db'
import {
  createConfiguredS3Client,
  parseObjectStorageConfiguration,
} from '@/server/storage/object-storage'
import {
  validateMediaId,
  validateStorageObjectKey,
} from '@/server/storage/upload-validation'

const PUBLIC_IMAGE_TYPES = new Set([
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function notFound() {
  return NextResponse.json({error: 'Media not found'}, {status: 404})
}

export async function GET(
  _request: Request,
  {params}: {params: Promise<{id: string}>},
) {
  const candidate = (await params).id
  let id: string

  try {
    id = validateMediaId(candidate)
  } catch {
    return notFound()
  }

  let media

  try {
    media = await prisma.mediaObject.findUnique({where: {id}})
  } catch {
    console.error('Media lookup failed')

    return NextResponse.json(
      {error: 'Media is temporarily unavailable'},
      {status: 503},
    )
  }

  if (
    !media ||
    media.provider !== 'garage' ||
    media.status !== 'READY' ||
    media.visibility !== 'PUBLIC'
  ) {
    return notFound()
  }

  const objectKey = media.objectKey
  const contentType = media.mimeType
  let safeObjectKey: string

  try {
    safeObjectKey = validateStorageObjectKey(objectKey)
  } catch {
    return notFound()
  }

  if (!PUBLIC_IMAGE_TYPES.has(contentType)) {
    return notFound()
  }

  let signedUrl: string

  try {
    const configuration = parseObjectStorageConfiguration()

    signedUrl = await getSignedUrl(
      createConfiguredS3Client(configuration),
      new GetObjectCommand({
        Bucket: configuration.bucket,
        Key: safeObjectKey,
        ResponseCacheControl:
          'public, max-age=31536000, immutable, no-transform',
        ResponseContentType: contentType,
      }),
      {expiresIn: 300},
    )
  } catch {
    console.error('Media signing failed')

    return NextResponse.json(
      {error: 'Media is temporarily unavailable'},
      {status: 503},
    )
  }

  const response = NextResponse.redirect(signedUrl, 307)

  response.headers.set(
    'Cache-Control',
    'public, max-age=240, stale-while-revalidate=60',
  )
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  return response
}

export const dynamic = 'force-dynamic'
