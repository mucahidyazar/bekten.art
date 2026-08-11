import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

import {executeDemoSeedPlan} from './lib/v2-demo-seed.mjs'

const E2E_FIXTURE_CONFIRMATION = 'bekten-art-e2e-fixtures'

function assertE2EFixturesAllowed(environment) {
  if (
    environment.NODE_ENV !== 'test' ||
    environment.E2E_FIXTURES_CONFIRMATION !== E2E_FIXTURE_CONFIRMATION
  ) {
    throw new Error('E2E_FIXTURES_NOT_AUTHORIZED')
  }
}

function createDatabase(environment) {
  const connectionString = environment.DATABASE_URL?.trim()

  if (!connectionString || !/^postgres(?:ql)?:\/\//u.test(connectionString)) {
    throw new Error('E2E_FIXTURES_DATABASE_CONFIGURATION_INVALID')
  }

  return new PrismaClient({
    adapter: new PrismaPg({connectionString}),
    log: ['error'],
  })
}

async function seedE2EFixtures({
  database,
  environment,
  executeSeed = executeDemoSeedPlan,
}) {
  assertE2EFixturesAllowed(environment)

  return executeSeed({
    database,
    environment: {
      ...environment,
      ALLOW_V2_DEMO_SEED: 'true',
      V2_DEMO_SEED_CONFIRMATION: 'bekten-art-v2-demo',
    },
    uploadAsset: async () => undefined,
  })
}

async function main(environment = process.env) {
  assertE2EFixturesAllowed(environment)
  const database = createDatabase(environment)

  try {
    const result = await seedE2EFixtures({database, environment})

    process.stdout.write(
      `E2E fixtures ready: ${result.created} created, ${result.existing} preserved.\n`,
    )
  } finally {
    await database.$disconnect()
  }
}

export {assertE2EFixturesAllowed, createDatabase, seedE2EFixtures}

const entryUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : ''

if (entryUrl === import.meta.url) {
  main().catch(error => {
    const message =
      error instanceof Error && /^E2E_FIXTURES_[A-Z0-9_]+$/u.test(error.message)
        ? error.message
        : 'E2E_FIXTURES_FAILED'

    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
}
