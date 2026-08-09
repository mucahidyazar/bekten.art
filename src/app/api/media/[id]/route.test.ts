import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  getSignedUrl: vi.fn(),
  mediaFindUnique: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    mediaObject: {findUnique: mocks.mediaFindUnique},
  },
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mocks.getSignedUrl,
}))

vi.mock('@/server/storage/object-storage', () => ({
  createConfiguredS3Client: vi.fn(() => ({})),
  parseObjectStorageConfiguration: vi.fn(() => ({
    accessKeyId: 'access',
    bucket: 'bekten-art-private-media',
    endpoint: 'https://s3.example',
    forcePathStyle: true,
    region: 'garage',
    secretAccessKey: 'secret',
  })),
}))

import {GET} from './route'

const FILE_ID = '44e9e0d0-77d1-498c-a9aa-15b7e040e1cc'

function mediaRequest(id = FILE_ID) {
  return GET(new Request(`https://bekten.art/api/media/${id}`), {
    params: Promise.resolve({id}),
  })
}

describe('GET /api/media/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mediaFindUnique.mockResolvedValue(null)
    mocks.getSignedUrl.mockResolvedValue(
      'https://s3.example/private/signed-object?signature=secret',
    )
  })

  it('rejects malformed UUIDs before database access', async () => {
    const response = await mediaRequest('../../environment')

    expect(response.status).toBe(404)
    expect(mocks.mediaFindUnique).not.toHaveBeenCalled()
  })

  it('does not sign unsupported media types or unsafe object keys', async () => {
    mocks.mediaFindUnique.mockResolvedValue({
      mimeType: 'text/html',
      objectKey: '../index.html',
      provider: 'garage',
      status: 'READY',
      visibility: 'PUBLIC',
    })

    const response = await mediaRequest()

    expect(response.status).toBe(404)
    expect(mocks.getSignedUrl).not.toHaveBeenCalled()
  })

  it('treats an authoritative private media row as not found', async () => {
    mocks.mediaFindUnique.mockResolvedValue({
      mimeType: 'image/webp',
      objectKey: 'gallery/private.webp',
      provider: 'garage',
      status: 'READY',
      visibility: 'PRIVATE',
    })

    const response = await mediaRequest()

    expect(response.status).toBe(404)
    expect(mocks.getSignedUrl).not.toHaveBeenCalled()
  })

  it('maps database outages to a safe temporary response', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    mocks.mediaFindUnique.mockRejectedValue(new Error('database host detail'))

    const response = await mediaRequest()

    expect(response.status).toBe(503)
    expect(consoleError).toHaveBeenCalledWith('Media lookup failed')
  })

  it('maps signing or storage configuration failures to a safe 503 response', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    mocks.mediaFindUnique.mockResolvedValue({
      mimeType: 'image/webp',
      objectKey: 'gallery/generated.webp',
      provider: 'garage',
      status: 'READY',
      visibility: 'PUBLIC',
    })
    mocks.getSignedUrl.mockRejectedValue(new Error('secret signing detail'))

    const response = await mediaRequest()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Media is temporarily unavailable',
    })
    expect(consoleError).toHaveBeenCalledWith('Media signing failed')
  })

  it('issues a short-lived private-bucket redirect with hardened response headers', async () => {
    mocks.mediaFindUnique.mockResolvedValue({
      mimeType: 'image/webp',
      objectKey: 'gallery/generated.webp',
      provider: 'garage',
      status: 'READY',
      visibility: 'PUBLIC',
    })

    const response = await mediaRequest()

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('https://s3.example/')
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=240, stale-while-revalidate=60',
    )
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
  })
})
