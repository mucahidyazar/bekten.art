import {readFile} from 'node:fs/promises'
import {resolve} from 'node:path'

import {describe, expect, it, vi} from 'vitest'

import {createDemoSeedPlan} from './lib/v2-demo-seed.mjs'
import {
  createAssetUploader,
  createDatabase,
  createGarageClient,
  demoSeedErrorMessage,
  parseGarageSeedConfiguration,
  readValidatedDemoAsset,
  runDemoSeed,
} from './seed-v2-demo.mjs'

const validEnvironment = Object.freeze({
  ALLOW_V2_DEMO_SEED: 'true',
  MEDIA_S3_ACCESS_KEY_ID: 'access-key',
  MEDIA_S3_BUCKET: 'bekten-art-media',
  MEDIA_S3_ENDPOINT: 'https://garage.example.com',
  MEDIA_S3_FORCE_PATH_STYLE: 'true',
  MEDIA_S3_REGION: 'garage',
  MEDIA_S3_SECRET_ACCESS_KEY: 'secret-key',
  V2_DEMO_SEED_CONFIRMATION: 'bekten-art-v2-demo',
})

describe('V2 demo seed runner', () => {
  it('uses only container-provided environment variables at runtime', async () => {
    const source = await readFile(
      resolve(process.cwd(), 'scripts/seed-v2-demo.mjs'),
      'utf8',
    )

    expect(source).not.toContain("import 'dotenv/config'")
  })

  it('ships the isolated Prisma and Garage runtime in the production image', async () => {
    const [dockerfile, runtimePackage] = await Promise.all([
      readFile(resolve(process.cwd(), 'Dockerfile.prod'), 'utf8'),
      readFile(
        resolve(process.cwd(), 'scripts/seed-runtime/package.json'),
        'utf8',
      ).then(JSON.parse),
    ])

    expect(runtimePackage.dependencies).toMatchObject({
      '@aws-sdk/client-s3': expect.any(String),
      '@prisma/adapter-pg': expect.any(String),
      '@prisma/client': expect.any(String),
    })
    expect(dockerfile).toContain('FROM base AS seed-runtime')
    expect(dockerfile).toContain(
      'COPY --from=seed-runtime --chown=nextjs:nodejs /seed-runtime/node_modules ./node_modules',
    )
  })

  it('exposes only allowlisted stable failure codes to operators', () => {
    expect(demoSeedErrorMessage(new Error('V2_DEMO_GARAGE_WRITE_FAILED'))).toBe(
      'V2_DEMO_GARAGE_WRITE_FAILED',
    )
    expect(demoSeedErrorMessage(new Error('postgres://user:secret@db'))).toBe(
      'V2_DEMO_SEED_FAILED',
    )
    expect(demoSeedErrorMessage({message: 'provider access secret'})).toBe(
      'V2_DEMO_SEED_FAILED',
    )
  })

  it('accepts only strict HTTPS path-style Garage configuration', () => {
    expect(parseGarageSeedConfiguration(validEnvironment)).toMatchObject({
      bucket: 'bekten-art-media',
      endpoint: 'https://garage.example.com/',
      forcePathStyle: true,
      region: 'garage',
    })
    expect(() =>
      parseGarageSeedConfiguration({
        ...validEnvironment,
        MEDIA_S3_ENDPOINT: 'http://garage.example.com',
      }),
    ).toThrow('V2_DEMO_GARAGE_CONFIGURATION_INVALID')
    expect(() =>
      parseGarageSeedConfiguration({
        ...validEnvironment,
        MEDIA_S3_ENDPOINT: 'not a URL',
      }),
    ).toThrow('V2_DEMO_GARAGE_CONFIGURATION_INVALID')
    expect(() => createDatabase({DATABASE_URL: 'file:unsafe.db'})).toThrow(
      'V2_DEMO_DATABASE_CONFIGURATION_INVALID',
    )
    expect(() =>
      parseGarageSeedConfiguration({
        ...validEnvironment,
        MEDIA_S3_BUCKET: '../other-bucket',
      }),
    ).toThrow('V2_DEMO_GARAGE_CONFIGURATION_INVALID')

    const client = createGarageClient(
      parseGarageSeedConfiguration(validEnvironment),
    )

    expect(client).toBeInstanceOf(Object)
    client.destroy()
  })

  it('blocks the runner before constructing external clients without intent', async () => {
    await expect(runDemoSeed({NODE_ENV: 'development'})).rejects.toThrow(
      'V2_DEMO_SEED_NOT_AUTHORIZED',
    )
  })

  it('verifies the repository asset size and checksum before upload', async () => {
    const assets = createDemoSeedPlan().media
    const [asset] = assets

    for (const currentAsset of assets) {
      await expect(
        readValidatedDemoAsset(currentAsset, process.cwd()),
      ).resolves.toHaveLength(currentAsset.sizeBytes)
    }
    await expect(
      readValidatedDemoAsset(
        {...asset, checksumSha256: '0'.repeat(64)},
        process.cwd(),
      ),
    ).rejects.toThrow('V2_DEMO_ASSET_INTEGRITY_INVALID')
    await expect(
      readValidatedDemoAsset(
        {...asset, assetPath: 'public/img/art/missing-demo.png'},
        process.cwd(),
      ),
    ).rejects.toThrow('V2_DEMO_ASSET_READ_FAILED')
    await expect(
      readValidatedDemoAsset(
        {...asset, assetPath: 'package.json'},
        process.cwd(),
      ),
    ).rejects.toThrow('V2_DEMO_ASSET_PATH_INVALID')
  })

  it('keeps matching Garage objects and repairs missing ones deterministically', async () => {
    const [asset] = createDemoSeedPlan().media
    const matchingClient = {
      send: vi.fn().mockResolvedValue({
        ContentLength: asset.sizeBytes,
        Metadata: {sha256: asset.checksumSha256},
      }),
    }
    const matchingUploader = createAssetUploader({
      bucket: 'bekten-art-media',
      client: matchingClient,
      rootDirectory: process.cwd(),
    })

    await matchingUploader(asset)
    expect(matchingClient.send).toHaveBeenCalledOnce()
    expect(matchingClient.send.mock.calls[0][0].constructor.name).toBe(
      'HeadObjectCommand',
    )

    const missingClient = {
      send: vi
        .fn()
        .mockRejectedValueOnce(
          Object.assign(new Error('missing'), {name: 'NotFound'}),
        )
        .mockResolvedValueOnce({}),
    }
    const repairUploader = createAssetUploader({
      bucket: 'bekten-art-media',
      client: missingClient,
      rootDirectory: process.cwd(),
    })

    await repairUploader(asset)
    expect(missingClient.send).toHaveBeenCalledTimes(2)
    expect(missingClient.send.mock.calls[1][0].constructor.name).toBe(
      'PutObjectCommand',
    )
    expect(missingClient.send.mock.calls[1][0].input).toMatchObject({
      Bucket: 'bekten-art-media',
      ContentType: 'image/png',
      Key: asset.objectKey,
      Metadata: {sha256: asset.checksumSha256},
    })

    const failedClient = {
      send: vi.fn().mockRejectedValue(new Error('secret provider failure')),
    }

    await expect(
      createAssetUploader({
        bucket: 'bekten-art-media',
        client: failedClient,
        rootDirectory: process.cwd(),
      })(asset),
    ).rejects.toThrow('V2_DEMO_GARAGE_READ_FAILED')

    const writeFailedClient = {
      send: vi
        .fn()
        .mockRejectedValueOnce(
          Object.assign(new Error('missing'), {name: 'NotFound'}),
        )
        .mockRejectedValueOnce(new Error('secret provider write failure')),
    }
    const failure = await createAssetUploader({
      bucket: 'bekten-art-media',
      client: writeFailedClient,
      rootDirectory: process.cwd(),
    })(asset).catch(error => error)

    expect(failure.message).toBe('V2_DEMO_GARAGE_WRITE_FAILED')
    expect(JSON.stringify(failure)).not.toContain('secret provider')
  })

  it('distinguishes Garage missing-object 403 responses before writing', async () => {
    const [asset] = createDemoSeedPlan().media
    const client = {
      send: vi
        .fn()
        .mockRejectedValueOnce(
          Object.assign(new Error('Garage hides missing keys'), {
            $metadata: {httpStatusCode: 403},
          }),
        )
        .mockResolvedValueOnce({Contents: []})
        .mockResolvedValueOnce({}),
    }
    const uploader = createAssetUploader({
      bucket: 'bekten-art-media',
      client,
      rootDirectory: process.cwd(),
    })

    await uploader(asset)

    expect(client.send).toHaveBeenCalledTimes(3)
    expect(
      client.send.mock.calls.map(([command]) => command.constructor.name),
    ).toEqual(['HeadObjectCommand', 'ListObjectsV2Command', 'PutObjectCommand'])
    expect(client.send.mock.calls[1][0].input).toEqual({
      Bucket: 'bekten-art-media',
      MaxKeys: 1,
      Prefix: asset.objectKey,
    })
  })

  it('verifies an existing Garage object when the proxy rejects HEAD', async () => {
    const [asset] = createDemoSeedPlan().media
    const consumeBody = vi.fn().mockResolvedValue(new Uint8Array())
    const client = {
      send: vi
        .fn()
        .mockRejectedValueOnce(
          Object.assign(new Error('HEAD not exposed'), {
            $metadata: {httpStatusCode: 403},
          }),
        )
        .mockResolvedValueOnce({
          Contents: [{Key: asset.objectKey, Size: asset.sizeBytes}],
        })
        .mockResolvedValueOnce({
          Body: {transformToByteArray: consumeBody},
          ContentLength: asset.sizeBytes,
          Metadata: {sha256: asset.checksumSha256},
        }),
    }

    await createAssetUploader({
      bucket: 'bekten-art-media',
      client,
      rootDirectory: process.cwd(),
    })(asset)

    expect(
      client.send.mock.calls.map(([command]) => command.constructor.name),
    ).toEqual(['HeadObjectCommand', 'ListObjectsV2Command', 'GetObjectCommand'])
    expect(consumeBody).toHaveBeenCalledOnce()
  })
})
