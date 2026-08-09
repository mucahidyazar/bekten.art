import {prisma} from '@/lib/db'
import {
  createContentService,
  createDatabaseContentRepository,
  type ContentDatabase,
} from '@/server/content'

export const contentRepository = createDatabaseContentRepository(
  prisma as unknown as ContentDatabase,
)

export const contentService = createContentService(contentRepository)
