import {prisma} from '@/lib/db'
import {createEditorialPublishingService} from '@/server/editorial-publishing'

import {createDatabaseEditorialPublishingRepository} from './database-publishing-repository'
import {
  editorialPublishingCodecs,
  validateEditorialAggregateSnapshot,
} from './editorial-codecs'

import type {EditorialPublishingDatabase} from './database-publishing-repository'

export const editorialPublishingRepository =
  createDatabaseEditorialPublishingRepository(
    prisma as unknown as EditorialPublishingDatabase,
    editorialPublishingCodecs,
  )

export const editorialPublishingService = createEditorialPublishingService(
  editorialPublishingRepository,
  {validateAggregate: validateEditorialAggregateSnapshot},
)
