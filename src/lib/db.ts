import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

declare global {
  var __prisma__: PrismaClient | undefined
}

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
  globalThis.__prisma__ ??= createPrismaClient()

  return globalThis.__prisma__
}

export const prisma = getPrismaClient()
