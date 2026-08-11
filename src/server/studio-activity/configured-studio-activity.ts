import {prisma} from '@/lib/db'

import {createDatabaseStudioActivityRepository} from './database-studio-activity-repository'
import {createStudioActivityService} from './studio-activity-service'

export const configuredStudioActivity = createStudioActivityService(
  createDatabaseStudioActivityRepository(prisma as never),
)
