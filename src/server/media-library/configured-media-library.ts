import {prisma} from '@/lib/db'

import {createMediaLibraryService} from './media-library-service'

import type {
  MediaLibraryRepository,
  MediaLibraryTransaction,
} from './media-library-service'
import type {Prisma, PrismaClient} from '@prisma/client'

type MediaLibraryPrisma = PrismaClient | Prisma.TransactionClient

function operations(database: MediaLibraryPrisma): MediaLibraryTransaction {
  return Object.freeze({
    audit: async (
      input: Parameters<MediaLibraryTransaction['audit']>[0],
    ) => {
      await database.auditEvent.create({data: input})
    },
    folder: Object.freeze({
      countChildren: (id: string) =>
        database.mediaFolder.count({where: {parentId: id}}),
      countMedia: (id: string) =>
        database.mediaObject.count({where: {folderId: id}}),
      create: (
        input: Parameters<MediaLibraryTransaction['folder']['create']>[0],
      ) =>
        database.mediaFolder.create({
          data: input,
          select: {
            id: true,
            name: true,
            parentId: true,
            version: true,
          },
        }),
      async delete(
        input: Parameters<MediaLibraryTransaction['folder']['delete']>[0],
      ) {
        const result = await database.mediaFolder.deleteMany({
          where: {id: input.id, version: input.version},
        })

        return result.count === 1
      },
      find: (id: string) =>
        database.mediaFolder.findUnique({
          select: {
            id: true,
            name: true,
            parentId: true,
            version: true,
          },
          where: {id},
        }),
      list: () =>
        database.mediaFolder.findMany({
          orderBy: [{createdAt: 'asc'}, {id: 'asc'}],
          select: {
            id: true,
            name: true,
            parentId: true,
            version: true,
          },
          take: 1_000,
        }),
      async update(
        input: Parameters<MediaLibraryTransaction['folder']['update']>[0],
      ) {
        const result = await database.mediaFolder.updateMany({
          data: {...input.data, version: {increment: 1}},
          where: {id: input.id, version: input.version},
        })

        return result.count === 1
      },
    }),
    media: Object.freeze({
      find: (id: string) =>
        database.mediaObject.findUnique({
          select: {id: true, version: true},
          where: {id, provider: 'garage'},
        }),
      async update(
        input: Parameters<MediaLibraryTransaction['media']['update']>[0],
      ) {
        const result = await database.mediaObject.updateMany({
          data: {...input.data, version: {increment: 1}},
          where: {
            id: input.id,
            provider: 'garage',
            version: input.version,
          },
        })

        return result.count === 1
      },
    }),
  })
}

const configuredMediaLibraryRepository: MediaLibraryRepository = Object.freeze(
  {
    ...operations(prisma),
    transaction: operation =>
      prisma.$transaction(transaction => operation(operations(transaction))),
  },
)

const configuredMediaLibraryService = createMediaLibraryService(
  configuredMediaLibraryRepository,
)

export {configuredMediaLibraryService}
