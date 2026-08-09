import {prisma} from '@/lib/db'

import {
  createOperationalRepository,
  type OperationalDatabase,
} from './operational-repository'

export const operationalRepository = createOperationalRepository(
  prisma as unknown as OperationalDatabase,
)
