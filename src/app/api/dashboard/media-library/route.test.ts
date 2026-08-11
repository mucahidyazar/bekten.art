import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  mediaObjectCount: vi.fn(),
  mediaObjectFindMany: vi.fn(),
  requireStudioEditor: vi.fn(),
}))

vi.mock('@/server/media-library/configured-media-library', () => ({
  configuredMediaLibraryService: {execute: mocks.execute},
}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))
vi.mock('@/lib/db', () => ({
  prisma: {
    mediaObject: {
      count: mocks.mediaObjectCount,
      findMany: mocks.mediaObjectFindMany,
    },
  },
}))

import {GET, POST} from './route'

function request(
  body: unknown,
  origin: string | null = 'https://bekten.art',
) {
  const payload = JSON.stringify(body)
  const headers = new Headers({
    'content-length': String(new TextEncoder().encode(payload).byteLength),
    'content-type': 'application/json',
  })

  if (origin) headers.set('origin', origin)

  return new Request('https://bekten.art/api/dashboard/media-library', {
    body: payload,
    headers,
    method: 'POST',
  })
}

describe('/api/dashboard/media-library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.requireStudioEditor.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      role: 'EDITOR',
    })
    mocks.execute.mockResolvedValue({success: true})
    mocks.mediaObjectCount.mockResolvedValue(1)
    mocks.mediaObjectFindMany.mockResolvedValue([
      {
        createdAt: new Date('2026-08-11T08:00:00.000Z'),
        displayName: 'Winter light',
        filename: 'winter-light.webp',
        folderId: null,
        height: 1200,
        id: '00000000-0000-4000-8000-000000000002',
        sizeBytes: 204800,
        status: 'READY',
        version: 1,
        width: 1600,
      },
    ])
  })

  it('rejects cross-origin commands before authentication', async () => {
    const response = await POST(
      request(
        {action: 'folder.create', name: 'Portraits', parentId: null},
        'https://attacker.example',
      ),
    )

    expect(response.status).toBe(403)
    expect(mocks.requireStudioEditor).not.toHaveBeenCalled()
  })

  it('passes a bounded command and owner capability to the service', async () => {
    mocks.requireStudioEditor.mockResolvedValueOnce({
      id: '11111111-1111-4111-8111-111111111111',
      role: 'OWNER',
    })
    const command = {
      action: 'folder.create',
      name: 'Portraits',
      parentId: null,
    }

    const response = await POST(request(command))

    expect(response.status).toBe(200)
    expect(mocks.execute).toHaveBeenCalledWith({
      actorUserId: '11111111-1111-4111-8111-111111111111',
      canDelete: true,
      command,
    })
  })

  it('returns an authenticated cursor page for older media', async () => {
    const response = await GET(
      new Request(
        'https://bekten.art/api/dashboard/media-library?cursor=00000000-0000-4000-8000-000000000001',
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      items: [
        expect.objectContaining({
          createdAt: '2026-08-11T08:00:00.000Z',
          id: '00000000-0000-4000-8000-000000000002',
        }),
      ],
      nextCursor: null,
      total: 1,
    })
    expect(mocks.mediaObjectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: {id: '00000000-0000-4000-8000-000000000001'},
        skip: 1,
        take: 101,
      }),
    )
  })

  it('maps validation and optimistic conflict errors without leaking details', async () => {
    mocks.execute.mockRejectedValueOnce(new Error('MEDIA_VERSION_CONFLICT'))

    const conflict = await POST(
      request({
        action: 'media.rename',
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Winter light',
        version: 1,
      }),
    )
    const invalid = await POST(request({action: 'drop-database'}))

    expect(conflict.status).toBe(409)
    await expect(conflict.json()).resolves.toEqual({
      error: 'The media library changed. Refresh and try again.',
    })
    expect(invalid.status).toBe(400)
  })
})
