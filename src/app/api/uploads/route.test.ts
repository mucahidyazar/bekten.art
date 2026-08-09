import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  auditCreate: vi.fn(),
  mediaCreate: vi.fn(),
  mediaDeleteMany: vi.fn(),
  mediaFindMany: vi.fn(),
  mediaFindUnique: vi.fn(),
  mediaUpdate: vi.fn(),
  prepareImageUpload: vi.fn(),
  requireAdminUser: vi.fn(),
  requireRecentAdminUser: vi.fn(),
  storageDelete: vi.fn(),
  storageWrite: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: mocks.transaction,
    auditEvent: {create: mocks.auditCreate},
    mediaObject: {
      create: mocks.mediaCreate,
      deleteMany: mocks.mediaDeleteMany,
      findMany: mocks.mediaFindMany,
      findUnique: mocks.mediaFindUnique,
      update: mocks.mediaUpdate,
    },
  },
}))

vi.mock('@/server/auth/access', () => {
  class AdminAccessRequiredError extends Error {
    readonly statusCode = 403
  }

  class AuthenticationRequiredError extends Error {
    readonly statusCode = 401
  }

  class RecentAuthenticationRequiredError extends Error {
    readonly statusCode = 403
  }

  return {
    AdminAccessRequiredError,
    AuthenticationRequiredError,
    RecentAuthenticationRequiredError,
    requireAdminUser: mocks.requireAdminUser,
    requireRecentAdminUser: mocks.requireRecentAdminUser,
  }
})

vi.mock('@/server/storage/object-storage', () => ({
  createConfiguredS3Client: vi.fn(() => ({})),
  createS3ObjectStorage: vi.fn(() => ({
    delete: mocks.storageDelete,
    write: mocks.storageWrite,
  })),
  parseObjectStorageConfiguration: vi.fn(() => ({
    accessKeyId: 'access',
    bucket: 'bekten-art-private-media',
    endpoint: 'https://s3.example',
    forcePathStyle: true,
    region: 'garage',
    secretAccessKey: 'secret',
  })),
}))

vi.mock(
  '@/server/storage/upload-validation',
  async importOriginal => {
    const actual = await importOriginal<
      typeof import('@/server/storage/upload-validation')
    >()

    return {...actual, prepareImageUpload: mocks.prepareImageUpload}
  },
)

import {
  AdminAccessRequiredError,
  AuthenticationRequiredError,
  RecentAuthenticationRequiredError,
} from '@/server/auth/access'

import {DELETE, GET, POST} from './route'

const FILE_ID = '44e9e0d0-77d1-498c-a9aa-15b7e040e1cc'

function mutationRequest(
  method: 'DELETE' | 'POST',
  origin = 'https://bekten.art',
) {
  if (method === 'DELETE') {
    return new Request(`https://bekten.art/api/uploads?id=${FILE_ID}`, {
      headers: {origin},
      method,
    })
  }

  const request = new Request('https://bekten.art/api/uploads', {
    body: 'test upload body',
    headers: {
      'content-length': '1000',
      'content-type': 'multipart/form-data; boundary=bekten-upload-test',
      origin,
    },
    method,
  })
  const uploadedFile = {
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    name: 'portrait.png',
    size: 3,
    type: 'image/png',
  }

  vi.spyOn(request, 'formData').mockResolvedValue({
    get(name: string) {
      return {
        bucket: 'images',
        file: uploadedFile,
        folder: 'gallery',
        sourceUrl: null,
      }[name] as FormDataEntryValue | null
    },
  } as FormData)

  return request
}

describe('/api/uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    vi.stubEnv('NEXTAUTH_URL', 'https://bekten.art')
    mocks.requireAdminUser.mockResolvedValue({
      id: '0e46c4d1-5d63-4915-abfe-42b63558a568',
      role: 'ADMIN',
    })
    mocks.requireRecentAdminUser.mockResolvedValue({
      id: '0e46c4d1-5d63-4915-abfe-42b63558a568',
      role: 'ADMIN',
    })
    mocks.mediaFindUnique.mockResolvedValue(null)
    mocks.mediaFindMany.mockResolvedValue([])
    mocks.mediaCreate.mockResolvedValue({id: FILE_ID})
    mocks.mediaUpdate.mockResolvedValue({id: FILE_ID})
    mocks.storageDelete.mockResolvedValue(undefined)
    mocks.storageWrite.mockResolvedValue(undefined)
    mocks.mediaUpdate.mockResolvedValue({
      createdAt: new Date('2026-08-09T00:00:00.000Z'),
      filename: 'generated.webp',
      id: FILE_ID,
      mimeType: 'image/webp',
      objectKey: 'gallery/generated.webp',
      sizeBytes: 3,
    })
    mocks.prepareImageUpload.mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      checksumSha256: 'base64-checksum',
      checksumSha256Hex: 'a'.repeat(64),
      contentType: 'image/webp',
      height: 1,
      objectKey: 'gallery/generated.webp',
      originalFileName: 'portrait.png',
      originalSize: 3,
      width: 1,
    })
    mocks.transaction.mockImplementation(async operation => {
      if (typeof operation === 'function') {
        return operation({
          auditEvent: {create: mocks.auditCreate},
          mediaObject: {
            create: mocks.mediaCreate,
            deleteMany: mocks.mediaDeleteMany,
            update: mocks.mediaUpdate,
          },
        })
      }

      return Promise.all(operation)
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each(['POST', 'DELETE'] as const)(
    'rejects a missing or cross-origin %s mutation before auth or storage work',
    async method => {
      const request = mutationRequest(method)

      request.headers.delete('origin')

      const response = method === 'POST' ? await POST(request) : await DELETE(request)

      expect(response.status).toBe(403)
      expect(mocks.requireAdminUser).not.toHaveBeenCalled()
      expect(mocks.requireRecentAdminUser).not.toHaveBeenCalled()
      expect(mocks.storageWrite).not.toHaveBeenCalled()
      expect(mocks.storageDelete).not.toHaveBeenCalled()
    },
  )

  it('maps missing authentication and forbidden admin access without leaking errors', async () => {
    mocks.requireAdminUser
      .mockRejectedValueOnce(new AuthenticationRequiredError())
      .mockRejectedValueOnce(new AdminAccessRequiredError())

    const unauthenticated = await GET(
      new Request('https://bekten.art/api/uploads'),
    )
    const forbidden = await GET(new Request('https://bekten.art/api/uploads'))

    expect(unauthenticated.status).toBe(401)
    await expect(unauthenticated.json()).resolves.toEqual({
      error: 'Authentication required',
    })
    expect(forbidden.status).toBe(403)
    await expect(forbidden.json()).resolves.toEqual({
      error: 'Admin access required',
    })
  })

  it('requires recent authentication for privileged media mutations', async () => {
    mocks.requireRecentAdminUser.mockRejectedValueOnce(
      new RecentAuthenticationRequiredError(),
    )

    const response = await POST(mutationRequest('POST'))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: 'Recent authentication required',
    })
    expect(mocks.prepareImageUpload).not.toHaveBeenCalled()
  })

  it('rejects an invalid delete identifier before querying the database', async () => {
    const response = await DELETE(
      new Request('https://bekten.art/api/uploads?id=../../all', {
        headers: {origin: 'https://bekten.art'},
        method: 'DELETE',
      }),
    )

    expect(response.status).toBe(400)
    expect(mocks.mediaFindUnique).not.toHaveBeenCalled()
  })

  it('returns not found without touching storage for an unknown managed id', async () => {
    const response = await DELETE(mutationRequest('DELETE'))

    expect(response.status).toBe(404)
    expect(mocks.storageDelete).not.toHaveBeenCalled()
  })

  it('makes media non-public before Garage deletion and keeps the failed row retryable', async () => {
    mocks.mediaFindUnique.mockResolvedValue({
      id: FILE_ID,
      objectKey: 'gallery/generated.webp',
      provider: 'garage',
    })
    mocks.storageDelete.mockRejectedValueOnce(
      new Error('secret endpoint and credential detail'),
    )

    const response = await DELETE(mutationRequest('DELETE'))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Media storage is temporarily unavailable',
    })
    expect(mocks.mediaDeleteMany).not.toHaveBeenCalled()
    expect(mocks.mediaUpdate).toHaveBeenCalledWith({
      data: {status: 'FAILED'},
      where: {id: FILE_ID},
    })
  })

  it('marks an upload failed and compensates Garage when final database work fails', async () => {
    mocks.transaction.mockRejectedValueOnce(new Error('database detail'))

    const response = await POST(mutationRequest('POST'))

    expect(response.status).toBe(500)
    expect(mocks.prepareImageUpload).toHaveBeenCalledTimes(1)
    expect(mocks.mediaCreate).toHaveBeenCalledTimes(1)
    expect(mocks.storageWrite).toHaveBeenCalledTimes(1)
    expect(mocks.storageDelete).toHaveBeenCalledWith('gallery/generated.webp')
    expect(mocks.mediaUpdate).toHaveBeenCalledWith({
      data: {status: 'FAILED'},
      where: {id: expect.any(String)},
    })
  })

  it('deletes the Garage object and typed media record with an audit event', async () => {
    mocks.mediaFindUnique.mockResolvedValue({
      id: FILE_ID,
      objectKey: 'gallery/generated.webp',
      provider: 'garage',
    })

    const response = await DELETE(mutationRequest('DELETE'))

    expect(response.status).toBe(200)
    expect(mocks.mediaUpdate).toHaveBeenCalledWith({
      data: {status: 'FAILED'},
      where: {id: FILE_ID},
    })
    expect(mocks.storageDelete).toHaveBeenCalledWith('gallery/generated.webp')
    expect(mocks.mediaDeleteMany).toHaveBeenCalledWith({where: {id: FILE_ID}})
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({action: 'media.deleted'}),
      }),
    )
  })

  it('lists a bounded cursor page and returns the next cursor', async () => {
    mocks.mediaFindMany.mockResolvedValue([
      {
        createdAt: new Date('2026-08-09T00:00:00.000Z'),
        filename: 'first.webp',
        id: FILE_ID,
        mimeType: 'image/webp',
        objectKey: 'gallery/first.webp',
        sizeBytes: 3,
      },
      {
        createdAt: new Date('2026-08-08T00:00:00.000Z'),
        filename: 'second.webp',
        id: '521ce059-e09d-428c-bc29-a44244c3d728',
        mimeType: 'image/webp',
        objectKey: 'gallery/second.webp',
        sizeBytes: 4,
      },
    ])

    const response = await GET(
      new Request(
        `https://bekten.art/api/uploads?folder=gallery&limit=1&cursor=${FILE_ID}`,
      ),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.files).toHaveLength(1)
    expect(payload.nextCursor).toBe(FILE_ID)
    expect(mocks.mediaFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: {id: FILE_ID},
        skip: 1,
        take: 2,
      }),
    )
  })

  it.each(['0', '101', '1.5', 'invalid'])(
    'rejects invalid list limit %s',
    async limit => {
      const response = await GET(
        new Request(`https://bekten.art/api/uploads?limit=${limit}`),
      )

      expect(response.status).toBe(400)
      expect(mocks.mediaFindMany).not.toHaveBeenCalled()
    },
  )

  it('rejects non-multipart upload metadata before parsing the body', async () => {
    const request = mutationRequest('POST')

    request.headers.set('content-type', 'application/json')

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(request.formData).not.toHaveBeenCalled()
    expect(mocks.prepareImageUpload).not.toHaveBeenCalled()
  })

  it('requires a bounded content length before buffering multipart data', async () => {
    const request = mutationRequest('POST')

    request.headers.delete('content-length')

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(request.formData).not.toHaveBeenCalled()
  })

  it.each([
    ['UPLOAD_FILE_TOO_LARGE', 413, 'File is too large'],
    ['UPLOAD_IMAGE_INVALID', 415, 'Invalid image upload'],
    ['UPLOAD_PATH_INVALID', 400, 'Invalid media request'],
  ] as const)(
    'maps the validation code %s to a safe client response',
    async (code, status, message) => {
      mocks.prepareImageUpload.mockRejectedValueOnce(new Error(code))

      const response = await POST(mutationRequest('POST'))

      expect(response.status).toBe(status)
      await expect(response.json()).resolves.toEqual({error: message})
      expect(mocks.storageWrite).not.toHaveBeenCalled()
    },
  )

  it('marks the provisional row failed when Garage write fails', async () => {
    mocks.storageWrite.mockRejectedValueOnce(new Error('S3 unavailable'))

    const response = await POST(mutationRequest('POST'))

    expect(response.status).toBe(503)
    expect(mocks.mediaUpdate).toHaveBeenCalledWith({
      data: {status: 'FAILED'},
      where: {id: expect.any(String)},
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('persists and returns a transformed Garage upload', async () => {
    const response = await POST(mutationRequest('POST'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      file: {
        bucket: 'images',
        name: 'generated.webp',
        type: 'image/webp',
      },
      success: true,
    })
    expect(mocks.mediaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({status: 'UPLOADING'}),
      }),
    )
    expect(mocks.mediaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({data: {status: 'READY'}}),
    )
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({action: 'media.uploaded'}),
      }),
    )
  })
})
