import {prisma} from '@/lib/db'

import {createDatabaseSiteLocaleRepository} from './database-site-locale-repository'
import {createSiteLocaleService} from './site-locale-service'

import type {SiteLocaleDatabase} from './database-site-locale-repository'

const siteLocaleDatabase: SiteLocaleDatabase = {
  $transaction: callback =>
    prisma.$transaction(transaction =>
      callback({
        auditEvent: {
          create: input => transaction.auditEvent.create(input as never),
        },
        siteLocale: {
          create: input => transaction.siteLocale.create(input as never),
          update: input => transaction.siteLocale.update(input as never),
        },
      }),
    ),
  siteLocale: {
    findMany: input => prisma.siteLocale.findMany(input as never),
    findUnique: input => prisma.siteLocale.findUnique(input as never),
  },
}

const configuredSiteLocaleRepository = createDatabaseSiteLocaleRepository(
  siteLocaleDatabase,
)
const configuredSiteLocaleService = createSiteLocaleService(
  configuredSiteLocaleRepository,
)

export {configuredSiteLocaleService}
