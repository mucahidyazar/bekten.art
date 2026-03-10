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

function getPrismaClient() {
  globalThis.__prisma__ ??= createPrismaClient()

  return globalThis.__prisma__
}

const BUILD_PHASE_MARKERS = ['next build', 'next/dist/bin/next', ' build']

function isBuildPhaseWithoutDatabase() {
  if (process.env.DATABASE_URL) {
    return false
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true
  }

  const argv = process.argv.join(' ')

  return BUILD_PHASE_MARKERS.some(marker => argv.includes(marker))
}

const prismaBuildMock: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    if (property === '$transaction') {
      return async (input: unknown) => {
        if (typeof input === 'function') {
          return input(prismaBuildMock)
        }

        return []
      }
    }

    if (
      property === '$connect' ||
      property === '$disconnect' ||
      property === '$on' ||
      property === '$use'
    ) {
      return async () => undefined
    }

    return new Proxy(
      {},
      {
        get(_modelTarget, method) {
          return async () => {
            if (
              method === 'createMany' ||
              method === 'updateMany' ||
              method === 'deleteMany'
            ) {
              return {count: 0}
            }

            if (method === 'count') {
              return 0
            }

            if (method === 'findMany') {
              return []
            }

            return null
          }
        },
      },
    )
  },
})

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    if (isBuildPhaseWithoutDatabase()) {
      const value = prismaBuildMock[property as keyof PrismaClient]

      return typeof value === 'function'
        ? value.bind(prismaBuildMock)
        : value
    }

    const client = getPrismaClient()
    const value = client[property as keyof PrismaClient]

    return typeof value === 'function' ? value.bind(client) : value
  },
}) as PrismaClient
