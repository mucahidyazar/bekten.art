import {DeleteObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3'
import {describe, expect, it, vi} from 'vitest'

import {
  createS3ObjectStorage,
  parseObjectStorageConfiguration,
} from './object-storage'

describe('Garage object storage', () => {
  it('parses a dedicated path-style Garage configuration', () => {
    expect(
      parseObjectStorageConfiguration({
        MEDIA_S3_ACCESS_KEY_ID: 'access',
        MEDIA_S3_BUCKET: 'bekten-art-private-media',
        MEDIA_S3_ENDPOINT: 'https://s3.garage.mucahid.dev/',
        MEDIA_S3_FORCE_PATH_STYLE: 'true',
        MEDIA_S3_REGION: 'garage',
        MEDIA_S3_SECRET_ACCESS_KEY: 'secret',
      }),
    ).toEqual({
      accessKeyId: 'access',
      bucket: 'bekten-art-private-media',
      endpoint: 'https://s3.garage.mucahid.dev',
      forcePathStyle: true,
      region: 'garage',
      secretAccessKey: 'secret',
    })
  })

  it('fails closed when any credential or bucket setting is missing', () => {
    expect(() => parseObjectStorageConfiguration({})).toThrow(
      'Object storage configuration is invalid',
    )
  })

  it.each([
    ['non-path-style Garage access', {MEDIA_S3_FORCE_PATH_STYLE: 'false'}],
    ['an invalid path-style value', {MEDIA_S3_FORCE_PATH_STYLE: 'yes'}],
    ['an endpoint containing credentials', {MEDIA_S3_ENDPOINT: 'https://user:password@s3.example'}],
    ['an endpoint containing a path', {MEDIA_S3_ENDPOINT: 'https://s3.example/private'}],
    ['an invalid bucket name', {MEDIA_S3_BUCKET: '../private'}],
  ])('fails closed for %s', (_case, override) => {
    expect(() =>
      parseObjectStorageConfiguration({
        MEDIA_S3_ACCESS_KEY_ID: 'access',
        MEDIA_S3_BUCKET: 'bekten-art-private-media',
        MEDIA_S3_ENDPOINT: 'https://s3.garage.mucahid.dev',
        MEDIA_S3_FORCE_PATH_STYLE: 'true',
        MEDIA_S3_REGION: 'garage',
        MEDIA_S3_SECRET_ACCESS_KEY: 'secret',
        ...override,
      }),
    ).toThrow('Object storage configuration is invalid')
  })

  it('writes immutable object metadata and cache policy', async () => {
    const send = vi.fn().mockResolvedValue({})
    const storage = createS3ObjectStorage({
      bucket: 'bekten-art-private-media',
      client: {send},
    })

    await storage.write({
      bytes: new Uint8Array([1, 2, 3]),
      checksumSha256: 'checksum',
      contentType: 'image/webp',
      objectKey: 'images/example.webp',
    })

    const command = send.mock.calls[0]?.[0]

    expect(command).toBeInstanceOf(PutObjectCommand)
    expect((command as PutObjectCommand).input).toMatchObject({
      Bucket: 'bekten-art-private-media',
      CacheControl: 'public, max-age=31536000, immutable, no-transform',
      ChecksumSHA256: 'checksum',
      ContentLength: 3,
      ContentType: 'image/webp',
      Key: 'images/example.webp',
      Metadata: {sha256: 'checksum'},
    })
  })

  it('deletes only the requested object from the configured bucket', async () => {
    const send = vi.fn().mockResolvedValue({})
    const storage = createS3ObjectStorage({
      bucket: 'bekten-art-private-media',
      client: {send},
    })

    await storage.delete('gallery/example.webp')

    const command = send.mock.calls[0]?.[0]

    expect(command).toBeInstanceOf(DeleteObjectCommand)
    expect((command as DeleteObjectCommand).input).toEqual({
      Bucket: 'bekten-art-private-media',
      Key: 'gallery/example.webp',
    })
  })

  it('rejects an unsafe object key before sending an S3 command', async () => {
    const send = vi.fn().mockResolvedValue({})
    const storage = createS3ObjectStorage({
      bucket: 'bekten-art-private-media',
      client: {send},
    })

    await expect(storage.delete('../private')).rejects.toThrow(
      'STORAGE_OBJECT_KEY_INVALID',
    )
    expect(send).not.toHaveBeenCalled()
  })
})
