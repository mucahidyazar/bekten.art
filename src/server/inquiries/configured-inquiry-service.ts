import {randomUUID} from 'node:crypto'

import {prisma} from '@/lib/db'
import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'

import {
  createDatabaseInquiryPersistence,
  type InquiryDatabase,
} from './database-inquiry-persistence'
import {createInquiryService} from './inquiry-service'

const persistence = createDatabaseInquiryPersistence(
  prisma as unknown as InquiryDatabase,
)

const inquiryService = createInquiryService({
  abuseGuard: {
    async check(input) {
      const result = await consumeConfiguredRateLimit({
        action: 'inquiry_submission',
        identifier: input.abuseKeyHash,
        policy: {limit: 5, windowMs: 60 * 60_000},
      })

      return {allowed: result.allowed}
    },
  },
  audit: persistence.audit,
  clock: {now: () => new Date()},
  idGenerator: {generate: randomUUID},
  outbox: persistence.outbox,
  privacyNoticeVersion: '2026-08-11',
  repository: persistence.repository,
  retentionDays: 730,
  unitOfWork: persistence.unitOfWork,
})

export const configuredInquiryManagement = persistence.management
export const configuredInquiryService = inquiryService
export const configuredInquiryUnitOfWork = persistence.unitOfWork
