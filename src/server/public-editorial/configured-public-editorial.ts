import {prisma} from '@/lib/db'

import {createDatabasePublicEditorialReader} from './database-public-editorial-reader'

import type {PublicEditorialDatabase} from './database-public-editorial-reader'

export const publicEditorialReader = createDatabasePublicEditorialReader(
  prisma as unknown as PublicEditorialDatabase,
)
