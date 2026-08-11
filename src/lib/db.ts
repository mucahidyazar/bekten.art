import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

import {selectPrismaClient} from './prisma-client-cache'

declare global {
  var __prisma__: PrismaClient | undefined
  var __prisma_schema_version__: string | undefined
}

const PRISMA_CLIENT_SCHEMA_VERSION = '20260811200000'

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to initialize Prisma')
  }

  return new PrismaClient({
    adapter: new PrismaPg({connectionString}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

function getPrismaClient(): PrismaClient {
  const client = selectPrismaClient({
    cached: globalThis.__prisma__,
    cachedSchemaVersion: globalThis.__prisma_schema_version__,
    create: createPrismaClient,
    expectedSchemaVersion: PRISMA_CLIENT_SCHEMA_VERSION,
  })

  globalThis.__prisma__ = client
  globalThis.__prisma_schema_version__ = PRISMA_CLIENT_SCHEMA_VERSION

  return client
}

export const prisma = getPrismaClient()
