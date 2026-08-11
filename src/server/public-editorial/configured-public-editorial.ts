import {prisma} from '@/lib/db'

import {createDatabasePublicEditorialReader} from './database-public-editorial-reader'

import type {
  PublicEditorialDatabase,
  PublicEditorialTransaction,
} from './database-public-editorial-reader'
import type {Prisma, PrismaClient} from '@prisma/client'

type PrismaFindMany = Readonly<{
  findMany: (arguments_: unknown) => Promise<readonly unknown[]>
}>

function findManyAdapter<Arguments>(
  findMany: (arguments_: Arguments) => Promise<unknown>,
): PrismaFindMany {
  return Object.freeze({
    findMany(arguments_: unknown) {
      return findMany(arguments_ as Arguments) as Promise<readonly unknown[]>
    },
  })
}

export function createPrismaPublicEditorialDatabase(
  client: PrismaClient,
): PublicEditorialDatabase {
  return Object.freeze({
    $transaction<Result>(
      callback: (
        transaction: PublicEditorialTransaction,
      ) => Promise<Result>,
    ) {
      return client.$transaction(async transaction =>
        callback({
          artwork: findManyAdapter((arguments_: Prisma.ArtworkFindManyArgs) =>
            transaction.artwork.findMany(arguments_),
          ),
          collection: findManyAdapter(
            (arguments_: Prisma.CollectionFindManyArgs) =>
              transaction.collection.findMany(arguments_),
          ),
          contentRevision: findManyAdapter(
            (arguments_: Prisma.ContentRevisionFindManyArgs) =>
              transaction.contentRevision.findMany(arguments_),
          ),
          exhibition: findManyAdapter(
            (arguments_: Prisma.ExhibitionFindManyArgs) =>
              transaction.exhibition.findMany(arguments_),
          ),
          exhibitionArtwork: findManyAdapter(
            (arguments_: Prisma.ExhibitionArtworkFindManyArgs) =>
              transaction.exhibitionArtwork.findMany(arguments_),
          ),
          journalEntry: findManyAdapter(
            (arguments_: Prisma.JournalEntryFindManyArgs) =>
              transaction.journalEntry.findMany(arguments_),
          ),
          mediaObject: findManyAdapter(
            (arguments_: Prisma.MediaObjectFindManyArgs) =>
              transaction.mediaObject.findMany(arguments_),
          ),
          page: findManyAdapter((arguments_: Prisma.PageFindManyArgs) =>
            transaction.page.findMany(arguments_),
          ),
          pressItem: findManyAdapter(
            (arguments_: Prisma.PressItemFindManyArgs) =>
              transaction.pressItem.findMany(arguments_),
          ),
        }),
      )
    },
  })
}

export const publicEditorialReader = createDatabasePublicEditorialReader(
  createPrismaPublicEditorialDatabase(prisma),
)
