import {randomUUID} from 'node:crypto'

import {prisma} from '@/lib/db'

import {
  createDatabaseStudioInquiryService,
  type StudioInquiryDatabase,
} from './database-studio-inquiry-service'

export const configuredStudioInquiryService =
  createDatabaseStudioInquiryService(
    prisma as unknown as StudioInquiryDatabase,
    {generateId: randomUUID},
  )
