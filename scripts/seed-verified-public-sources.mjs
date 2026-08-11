import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

import {executeVerifiedPublicSourceSeed} from './lib/verified-public-sources.mjs'

function createDatabase(environment) {
  const connectionString = environment.DATABASE_URL?.trim()

  if (!connectionString || !/^postgres(?:ql)?:\/\//u.test(connectionString)) {
    throw new Error('VERIFIED_PUBLIC_SOURCE_DATABASE_CONFIGURATION_INVALID')
  }

  return new PrismaClient({adapter: new PrismaPg({connectionString})})
}

async function main(environment = process.env) {
  const database = createDatabase(environment)

  try {
    const result = await executeVerifiedPublicSourceSeed({database, environment})

    console.log(
      `Verified public sources complete: ${result.created} created, ${result.preserved} preserved, ${result.sources} sources.`,
    )
  } finally {
    await database.$disconnect()
  }
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : ''

if (import.meta.url === invokedPath) {
  main().catch(error => {
    const message =
      error instanceof Error &&
      /^VERIFIED_PUBLIC_SOURCE_[A-Z0-9_]+$/u.test(error.message)
        ? error.message
        : 'VERIFIED_PUBLIC_SOURCE_SEED_FAILED'

    console.error(message)
    process.exitCode = 1
  })
}
