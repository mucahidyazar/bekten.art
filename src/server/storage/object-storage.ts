import {DeleteObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3'

import {validateStorageObjectKey} from './upload-validation'

type Environment = Readonly<Record<string, string | undefined>>

export type ObjectStorageConfiguration = Readonly<{
  accessKeyId: string
  bucket: string
  endpoint: string
  forcePathStyle: boolean
  region: string
  secretAccessKey: string
}>

type S3ClientLike = Readonly<{
  send: (command: DeleteObjectCommand | PutObjectCommand) => Promise<unknown>
}>

function value(environment: Environment, key: string) {
  return environment[key]?.trim() ?? ''
}

export function createConfiguredS3Client(config: ObjectStorageConfiguration) {
  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    region: config.region,
  })
}

export function createS3ObjectStorage({
  bucket,
  client,
}: Readonly<{
  bucket: string
  client: S3ClientLike
}>) {
  return {
    async delete(objectKey: string) {
      const safeObjectKey = validateStorageObjectKey(objectKey)

      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: safeObjectKey,
        }),
      )
    },
    async write(input: Readonly<{
      bytes: Uint8Array
      checksumSha256: string
      contentType: string
      objectKey: string
    }>) {
      const safeObjectKey = validateStorageObjectKey(input.objectKey)

      await client.send(
        new PutObjectCommand({
          Body: input.bytes,
          Bucket: bucket,
          CacheControl: 'public, max-age=31536000, immutable, no-transform',
          ChecksumSHA256: input.checksumSha256,
          ContentLength: input.bytes.byteLength,
          ContentType: input.contentType,
          Key: safeObjectKey,
          Metadata: {sha256: input.checksumSha256},
        }),
      )
    },
  }
}

export function parseObjectStorageConfiguration(
  environment: Environment = process.env,
): ObjectStorageConfiguration {
  const accessKeyId = value(environment, 'MEDIA_S3_ACCESS_KEY_ID')
  const bucket = value(environment, 'MEDIA_S3_BUCKET')
  const endpoint = value(environment, 'MEDIA_S3_ENDPOINT')
  const forcePathStyle = value(environment, 'MEDIA_S3_FORCE_PATH_STYLE')
  const region = value(environment, 'MEDIA_S3_REGION')
  const secretAccessKey = value(environment, 'MEDIA_S3_SECRET_ACCESS_KEY')

  let parsedEndpoint: URL | null = null

  try {
    parsedEndpoint = new URL(endpoint)
  } catch {
    parsedEndpoint = null
  }

  const validBucket =
    bucket.length >= 3 &&
    bucket.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u.test(bucket) &&
    !bucket.includes('..')
  const validEndpoint =
    parsedEndpoint !== null &&
    (parsedEndpoint.protocol === 'https:' ||
      parsedEndpoint.hostname === 'localhost') &&
    parsedEndpoint.pathname === '/' &&
    !parsedEndpoint.username &&
    !parsedEndpoint.password &&
    !parsedEndpoint.search &&
    !parsedEndpoint.hash

  if (
    !accessKeyId ||
    !validBucket ||
    !validEndpoint ||
    forcePathStyle !== 'true' ||
    !region ||
    !secretAccessKey
  ) {
    throw new Error('Object storage configuration is invalid')
  }

  return {
    accessKeyId,
    bucket,
    endpoint: parsedEndpoint!.toString().replace(/\/$/, ''),
    forcePathStyle: true,
    region,
    secretAccessKey,
  }
}
