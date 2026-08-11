import {prisma} from '@/lib/db'

import {createDatabaseEditorialContentRepository} from './database-content-repository'
import {editorialEntityCodecs} from './editorial-entity-codecs'

import type {EditorialContentDatabase} from './database-content-repository'

export const editorialContentRepository =
  createDatabaseEditorialContentRepository(
    prisma as unknown as EditorialContentDatabase,
    editorialEntityCodecs,
  )
