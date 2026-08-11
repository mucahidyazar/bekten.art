import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  createMediaLibraryService,
  type MediaLibraryRepository,
} from './media-library-service'

const actorUserId = '11111111-1111-4111-8111-111111111111'
const folderId = '22222222-2222-4222-8222-222222222222'
const childId = '33333333-3333-4333-8333-333333333333'
const mediaId = '44444444-4444-4444-8444-444444444444'

const repository = {
  audit: vi.fn(),
  folder: {
    countChildren: vi.fn(),
    countMedia: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    find: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  },
  media: {find: vi.fn(), update: vi.fn()},
  transaction: vi.fn(),
}

describe('media library service', () => {
  let service: ReturnType<typeof createMediaLibraryService>

  beforeEach(() => {
    vi.clearAllMocks()
    repository.transaction.mockImplementation(operation => operation(repository))
    repository.folder.find.mockResolvedValue(null)
    repository.folder.list.mockResolvedValue([])
    repository.folder.create.mockResolvedValue({
      id: folderId,
      name: 'Portraits',
      parentId: null,
      version: 1,
    })
    repository.folder.update.mockResolvedValue(true)
    repository.folder.delete.mockResolvedValue(true)
    repository.folder.countChildren.mockResolvedValue(0)
    repository.folder.countMedia.mockResolvedValue(0)
    repository.media.find.mockResolvedValue({
      id: mediaId,
      version: 1,
    })
    repository.media.update.mockResolvedValue(true)
    repository.audit.mockResolvedValue(undefined)
    service = createMediaLibraryService(repository as MediaLibraryRepository)
  })

  it('creates a normalized virtual folder and writes a bounded audit event', async () => {
    await service.execute({
      actorUserId,
      canDelete: false,
      command: {action: 'folder.create', name: '  Portraits  ', parentId: null},
    })

    expect(repository.folder.create).toHaveBeenCalledWith({
      createdById: actorUserId,
      name: 'Portraits',
      normalizedName: 'portraits',
      parentId: null,
    })
    expect(repository.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'media-folder.created',
        actorUserId,
        entityId: folderId,
      }),
    )
  })

  it('rejects moving a folder into itself or one of its descendants', async () => {
    repository.folder.find.mockResolvedValue({
      id: childId,
      name: 'Child',
      parentId: folderId,
      version: 1,
    })
    repository.folder.list.mockResolvedValue([
      {id: folderId, name: 'Portraits', parentId: null, version: 1},
      {id: childId, name: 'Child', parentId: folderId, version: 1},
    ])

    await expect(
      service.execute({
        actorUserId,
        canDelete: false,
        command: {
          action: 'folder.move',
          id: folderId,
          parentId: childId,
          version: 1,
        },
      }),
    ).rejects.toThrow('MEDIA_FOLDER_CYCLE')
    expect(repository.folder.update).not.toHaveBeenCalled()
  })

  it('uses optimistic versions for media rename and move commands', async () => {
    repository.media.update.mockResolvedValueOnce(false)

    await expect(
      service.execute({
        actorUserId,
        canDelete: false,
        command: {
          action: 'media.rename',
          id: mediaId,
          name: 'Winter study',
          version: 1,
        },
      }),
    ).rejects.toThrow('MEDIA_VERSION_CONFLICT')
  })

  it('does not mutate an unknown media identifier', async () => {
    repository.media.find.mockResolvedValueOnce(null)

    await expect(
      service.execute({
        actorUserId,
        canDelete: false,
        command: {
          action: 'media.rename',
          id: mediaId,
          name: 'Winter study',
          version: 1,
        },
      }),
    ).rejects.toThrow('MEDIA_NOT_FOUND')
    expect(repository.media.update).not.toHaveBeenCalled()
  })

  it('protects folder deletion by role and non-empty state', async () => {
    await expect(
      service.execute({
        actorUserId,
        canDelete: false,
        command: {action: 'folder.delete', id: folderId, version: 1},
      }),
    ).rejects.toThrow('MEDIA_DELETE_FORBIDDEN')

    repository.folder.countMedia.mockResolvedValueOnce(1)

    await expect(
      service.execute({
        actorUserId,
        canDelete: true,
        command: {action: 'folder.delete', id: folderId, version: 1},
      }),
    ).rejects.toThrow('MEDIA_FOLDER_NOT_EMPTY')
  })

  it('rejects invalid identifiers, names and unknown commands at the boundary', async () => {
    await expect(
      service.execute({
        actorUserId,
        canDelete: true,
        command: {
          action: 'media.rename',
          id: '../../all',
          name: '<script>',
          version: 0,
        },
      }),
    ).rejects.toThrow()
    expect(repository.transaction).not.toHaveBeenCalled()
  })
})
