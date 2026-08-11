import {createHash} from 'node:crypto'
import {readFile, realpath} from 'node:fs/promises'
import {dirname, resolve, sep} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

import {
  assertDemoSeedAllowed,
  executeDemoSeedPlan,
} from './lib/v2-demo-seed.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')

function environmentValue(environment, name) {
  const value = environment[name]

  return typeof value === 'string' ? value.trim() : ''
}

export function createAssetUploader({bucket, client, rootDirectory}) {
  return async item => {
    const bytes = await readValidatedDemoAsset(item, rootDirectory)
    let current = null

    try {
      current = await client.send(
        new HeadObjectCommand({Bucket: bucket, Key: item.objectKey}),
      )
    } catch (error) {
      if (isForbiddenObjectLookup(error)) {
        let listing

        try {
          listing = await client.send(
            new ListObjectsV2Command({
              Bucket: bucket,
              MaxKeys: 1,
              Prefix: item.objectKey,
            }),
          )
        } catch {
          throw new Error('V2_DEMO_GARAGE_READ_FAILED')
        }

        if (listing.Contents?.some(object => object.Key === item.objectKey)) {
          throw new Error('V2_DEMO_GARAGE_READ_FAILED')
        }
      } else if (!isMissingObject(error)) {
        throw new Error('V2_DEMO_GARAGE_READ_FAILED')
      }
    }

    if (
      current?.ContentLength === item.sizeBytes &&
      current.Metadata?.sha256 === item.checksumSha256
    ) {
      return
    }

    try {
      await client.send(
        new PutObjectCommand({
          Body: bytes,
          Bucket: bucket,
          CacheControl: 'public, max-age=31536000, immutable',
          ContentType: item.mimeType,
          Key: item.objectKey,
          Metadata: {sha256: item.checksumSha256},
        }),
      )
    } catch {
      throw new Error('V2_DEMO_GARAGE_WRITE_FAILED')
    }
  }
}

export function createDatabase(environment) {
  const connectionString = environmentValue(environment, 'DATABASE_URL')

  if (!/^postgres(?:ql)?:\/\//u.test(connectionString)) {
    throw new Error('V2_DEMO_DATABASE_CONFIGURATION_INVALID')
  }

  return new PrismaClient({
    adapter: new PrismaPg({connectionString}),
    log: ['error'],
  })
}

export function createGarageClient(configuration) {
  return new S3Client({
    credentials: {
      accessKeyId: configuration.accessKeyId,
      secretAccessKey: configuration.secretAccessKey,
    },
    endpoint: configuration.endpoint,
    forcePathStyle: configuration.forcePathStyle,
    region: configuration.region,
  })
}

export function demoSeedErrorMessage(error) {
  return error instanceof Error && /^V2_DEMO_[A-Z0-9_]+$/u.test(error.message)
    ? error.message
    : 'V2_DEMO_SEED_FAILED'
}

export function parseGarageSeedConfiguration(environment) {
  const accessKeyId = environmentValue(environment, 'MEDIA_S3_ACCESS_KEY_ID')
  const bucket = environmentValue(environment, 'MEDIA_S3_BUCKET')
  const endpointValue = environmentValue(environment, 'MEDIA_S3_ENDPOINT')
  const forcePathStyle = environmentValue(
    environment,
    'MEDIA_S3_FORCE_PATH_STYLE',
  )
  const region = environmentValue(environment, 'MEDIA_S3_REGION')
  const secretAccessKey = environmentValue(
    environment,
    'MEDIA_S3_SECRET_ACCESS_KEY',
  )
  let endpoint

  try {
    endpoint = new URL(endpointValue)
  } catch {
    throw new Error('V2_DEMO_GARAGE_CONFIGURATION_INVALID')
  }

  if (
    !accessKeyId ||
    !secretAccessKey ||
    !region ||
    forcePathStyle !== 'true' ||
    endpoint.protocol !== 'https:' ||
    endpoint.username ||
    endpoint.password ||
    endpoint.pathname !== '/' ||
    endpoint.search ||
    endpoint.hash ||
    !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u.test(bucket) ||
    bucket.includes('..')
  ) {
    throw new Error('V2_DEMO_GARAGE_CONFIGURATION_INVALID')
  }

  return Object.freeze({
    accessKeyId,
    bucket,
    endpoint: endpoint.toString(),
    forcePathStyle: true,
    region,
    secretAccessKey,
  })
}

function isMissingObject(error) {
  return (
    error instanceof Error &&
    (error.name === 'NotFound' ||
      error.name === 'NoSuchKey' ||
      error.$metadata?.httpStatusCode === 404)
  )
}

function isForbiddenObjectLookup(error) {
  return error instanceof Error && error.$metadata?.httpStatusCode === 403
}

export async function readValidatedDemoAsset(item, rootDirectory) {
  let allowedRoot
  let bytes
  let candidate

  try {
    allowedRoot = await realpath(resolve(rootDirectory, 'public/img'))
    candidate = await realpath(resolve(rootDirectory, item.assetPath))
  } catch {
    throw new Error('V2_DEMO_ASSET_READ_FAILED')
  }

  if (
    candidate !== allowedRoot &&
    !candidate.startsWith(`${allowedRoot}${sep}`)
  ) {
    throw new Error('V2_DEMO_ASSET_PATH_INVALID')
  }

  try {
    bytes = await readFile(candidate)
  } catch {
    throw new Error('V2_DEMO_ASSET_READ_FAILED')
  }

  const checksum = createHash('sha256').update(bytes).digest('hex')

  if (bytes.byteLength !== item.sizeBytes || checksum !== item.checksumSha256) {
    throw new Error('V2_DEMO_ASSET_INTEGRITY_INVALID')
  }

  return bytes
}

async function runDemoSeedUnchecked(environment) {
  assertDemoSeedAllowed(environment)
  const garage = parseGarageSeedConfiguration(environment)
  const database = createDatabase(environment)
  const client = createGarageClient(garage)

  try {
    return await executeDemoSeedPlan({
      database,
      environment,
      uploadAsset: createAssetUploader({
        bucket: garage.bucket,
        client,
        rootDirectory: projectRoot,
      }),
    })
  } finally {
    client.destroy()
    await database.$disconnect()
  }
}

export async function runDemoSeed(environment = process.env) {
  try {
    return await runDemoSeedUnchecked(environment)
  } catch (error) {
    throw new Error(demoSeedErrorMessage(error))
  }
}

const entryUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : ''

if (entryUrl === import.meta.url) {
  runDemoSeed()
    .then(result => {
      console.info(
        `V2 demo seed complete: ${result.created} created, ${result.existing} preserved, ${result.media} media verified.`,
      )
    })
    .catch(error => {
      console.error(demoSeedErrorMessage(error))
      process.exitCode = 1
    })
}
