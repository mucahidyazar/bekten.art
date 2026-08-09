import {prisma} from '@/lib/db'
import {
  createRetentionService,
  type RetentionDatabase,
} from '@/server/operations/retention'

export function getConfiguredRetentionService() {
  return createRetentionService(prisma as unknown as RetentionDatabase)
}
