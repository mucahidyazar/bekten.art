import {z} from 'zod'

const idSchema = z.uuid()
const versionSchema = z.number().int().min(1).max(2_147_483_647)
const itemNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[^<>/\\\u0000-\u001f\u007f]+$/u)
  .transform(value => value.normalize('NFKC').replaceAll(/\s+/gu, ' '))
const folderNameSchema = itemNameSchema.pipe(z.string().max(120))
const nullableFolderIdSchema = idSchema.nullable()

const mediaLibraryCommandSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('folder.create'),
      name: folderNameSchema,
      parentId: nullableFolderIdSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('folder.delete'),
      id: idSchema,
      version: versionSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('folder.move'),
      id: idSchema,
      parentId: nullableFolderIdSchema,
      version: versionSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('folder.rename'),
      id: idSchema,
      name: folderNameSchema,
      version: versionSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('media.move'),
      id: idSchema,
      parentId: nullableFolderIdSchema,
      version: versionSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('media.rename'),
      id: idSchema,
      name: itemNameSchema,
      version: versionSchema,
    })
    .strict(),
])

type MediaLibraryCommand = z.infer<typeof mediaLibraryCommandSchema>
type MediaFolderRecord = Readonly<{
  id: string
  name: string
  parentId: string | null
  version: number
}>
type MediaRecord = Readonly<{id: string; version: number}>
type MediaLibraryTransaction = Readonly<{
  audit: (input: Readonly<{
    action: string
    actorUserId: string
    entityId: string
    entityType: 'MediaFolder' | 'MediaObject'
    metadata: Readonly<Record<string, boolean | number | string | null>>
  }>) => Promise<void>
  folder: Readonly<{
    countChildren: (id: string) => Promise<number>
    countMedia: (id: string) => Promise<number>
    create: (input: Readonly<{
      createdById: string
      name: string
      normalizedName: string
      parentId: string | null
    }>) => Promise<MediaFolderRecord>
    delete: (input: Readonly<{id: string; version: number}>) => Promise<boolean>
    find: (id: string) => Promise<MediaFolderRecord | null>
    list: () => Promise<readonly MediaFolderRecord[]>
    update: (input: Readonly<{
      data: Readonly<{
        name?: string
        normalizedName?: string
        parentId?: string | null
      }>
      id: string
      version: number
    }>) => Promise<boolean>
  }>
  media: Readonly<{
    find: (id: string) => Promise<MediaRecord | null>
    update: (input: Readonly<{
      data: Readonly<{displayName?: string; folderId?: string | null}>
      id: string
      version: number
    }>) => Promise<boolean>
  }>
}>
type MediaLibraryRepository = MediaLibraryTransaction &
  Readonly<{
    transaction: <Result>(
      operation: (transaction: MediaLibraryTransaction) => Promise<Result>,
    ) => Promise<Result>
  }>

function normalizedName(name: string) {
  return name.normalize('NFKC').toLocaleLowerCase('en')
}

async function requireFolder(
  transaction: MediaLibraryTransaction,
  id: string | null,
) {
  if (!id) return null

  const folder = await transaction.folder.find(id)

  if (!folder) throw new Error('MEDIA_FOLDER_NOT_FOUND')

  return folder
}

function assertNoFolderCycle(
  folders: readonly MediaFolderRecord[],
  movingFolderId: string,
  parentId: string | null,
) {
  if (!parentId) return
  if (parentId === movingFolderId) throw new Error('MEDIA_FOLDER_CYCLE')

  const byId = new Map(folders.map(folder => [folder.id, folder]))
  const visited = new Set<string>()
  let currentId: string | null = parentId

  while (currentId) {
    if (currentId === movingFolderId) throw new Error('MEDIA_FOLDER_CYCLE')
    if (visited.has(currentId)) throw new Error('MEDIA_FOLDER_TREE_INVALID')

    visited.add(currentId)
    currentId = byId.get(currentId)?.parentId ?? null
  }
}

function createMediaLibraryService(repository: MediaLibraryRepository) {
  async function execute(input: Readonly<{
    actorUserId: string
    canDelete: boolean
    command: unknown
  }>) {
    const actorUserId = idSchema.parse(input.actorUserId)
    const command = mediaLibraryCommandSchema.parse(input.command)

    return repository.transaction(async transaction => {
      if (command.action === 'folder.create') {
        await requireFolder(transaction, command.parentId)
        const folder = await transaction.folder.create({
          createdById: actorUserId,
          name: command.name,
          normalizedName: normalizedName(command.name),
          parentId: command.parentId,
        })

        await transaction.audit({
          action: 'media-folder.created',
          actorUserId,
          entityId: folder.id,
          entityType: 'MediaFolder',
          metadata: {parentId: command.parentId},
        })

        return Object.freeze({id: folder.id, success: true})
      }

      if (command.action === 'folder.delete') {
        if (!input.canDelete) throw new Error('MEDIA_DELETE_FORBIDDEN')

        const [children, media] = await Promise.all([
          transaction.folder.countChildren(command.id),
          transaction.folder.countMedia(command.id),
        ])

        if (children > 0 || media > 0) throw new Error('MEDIA_FOLDER_NOT_EMPTY')

        if (!(await transaction.folder.delete(command))) {
          throw new Error('MEDIA_VERSION_CONFLICT')
        }

        await transaction.audit({
          action: 'media-folder.deleted',
          actorUserId,
          entityId: command.id,
          entityType: 'MediaFolder',
          metadata: {version: command.version},
        })

        return Object.freeze({id: command.id, success: true})
      }

      if (command.action === 'folder.move') {
        await requireFolder(transaction, command.parentId)
        assertNoFolderCycle(
          await transaction.folder.list(),
          command.id,
          command.parentId,
        )

        if (
          !(await transaction.folder.update({
            data: {parentId: command.parentId},
            id: command.id,
            version: command.version,
          }))
        ) {
          throw new Error('MEDIA_VERSION_CONFLICT')
        }

        await transaction.audit({
          action: 'media-folder.moved',
          actorUserId,
          entityId: command.id,
          entityType: 'MediaFolder',
          metadata: {parentId: command.parentId, version: command.version},
        })

        return Object.freeze({id: command.id, success: true})
      }

      if (command.action === 'folder.rename') {
        if (
          !(await transaction.folder.update({
            data: {
              name: command.name,
              normalizedName: normalizedName(command.name),
            },
            id: command.id,
            version: command.version,
          }))
        ) {
          throw new Error('MEDIA_VERSION_CONFLICT')
        }

        await transaction.audit({
          action: 'media-folder.renamed',
          actorUserId,
          entityId: command.id,
          entityType: 'MediaFolder',
          metadata: {version: command.version},
        })

        return Object.freeze({id: command.id, success: true})
      }

      if (!(await transaction.media.find(command.id))) {
        throw new Error('MEDIA_NOT_FOUND')
      }

      if (command.action === 'media.move') {
        await requireFolder(transaction, command.parentId)

        if (
          !(await transaction.media.update({
            data: {folderId: command.parentId},
            id: command.id,
            version: command.version,
          }))
        ) {
          throw new Error('MEDIA_VERSION_CONFLICT')
        }

        await transaction.audit({
          action: 'media.moved',
          actorUserId,
          entityId: command.id,
          entityType: 'MediaObject',
          metadata: {folderId: command.parentId, version: command.version},
        })
      } else {
        if (
          !(await transaction.media.update({
            data: {displayName: command.name},
            id: command.id,
            version: command.version,
          }))
        ) {
          throw new Error('MEDIA_VERSION_CONFLICT')
        }

        await transaction.audit({
          action: 'media.renamed',
          actorUserId,
          entityId: command.id,
          entityType: 'MediaObject',
          metadata: {version: command.version},
        })
      }

      return Object.freeze({id: command.id, success: true})
    })
  }

  return Object.freeze({execute})
}

export type {
  MediaFolderRecord,
  MediaLibraryCommand,
  MediaLibraryRepository,
  MediaLibraryTransaction,
  MediaRecord,
}

export {createMediaLibraryService, mediaLibraryCommandSchema}
