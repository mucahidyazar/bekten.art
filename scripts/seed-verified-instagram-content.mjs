import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

import {executeVerifiedInstagramSeed} from './lib/verified-instagram-content.mjs'

function createDatabase(environment) {
  const connectionString = environment.DATABASE_URL?.trim()

  if (!connectionString || !/^postgres(?:ql)?:\/\//u.test(connectionString)) {
    throw new Error('VERIFIED_INSTAGRAM_DATABASE_CONFIGURATION_INVALID')
  }

  return new PrismaClient({
    adapter: new PrismaPg({connectionString}),
    log: ['error'],
  })
}

async function main(environment = process.env) {
  const database = createDatabase(environment)

  try {
    const result = await executeVerifiedInstagramSeed({database, environment})

    console.log(
      `Verified Instagram seed complete: ${result.created} created, ${result.existing} preserved, ${result.sources} verified sources, ${result.rejected} rejected.`,
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
      /^VERIFIED_INSTAGRAM_[A-Z0-9_]+$/u.test(error.message)
        ? error.message
        : 'VERIFIED_INSTAGRAM_SEED_FAILED'

    console.error(message)
    process.exitCode = 1
  })
}
