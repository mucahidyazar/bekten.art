import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'

import {
  assertLocalEditorialRefreshAllowed,
  createLocalEditorialRefreshPlan,
  executeLocalEditorialRefresh,
} from './lib/refresh-local-editorial-content.mjs'
import {createDemoSeedPlan} from './lib/v2-demo-seed.mjs'

function connectionString(environment) {
  const value = environment.DATABASE_URL?.trim()

  if (!value || !/^postgres(?:ql)?:\/\//u.test(value)) {
    throw new Error('LOCAL_EDITORIAL_DATABASE_CONFIGURATION_INVALID')
  }

  return value
}

async function main() {
  assertLocalEditorialRefreshAllowed(process.env)
  const database = new PrismaClient({
    adapter: new PrismaPg({connectionString: connectionString(process.env)}),
    log: ['error'],
  })

  try {
    const instagramMedia = await database.instagramPost.findMany({
      orderBy: [
        {is_pinned: 'desc'},
        {display_order: 'asc'},
        {posted_at: 'desc'},
      ],
      select: {
        alt_text: true,
        caption: true,
        media_object_id: true,
      },
      where: {
        is_active: true,
        media_object: {status: 'READY', visibility: 'PUBLIC'},
        media_object_id: {not: null},
      },
    })
    const media = instagramMedia.flatMap(item =>
      item.media_object_id
        ? [
            {
              altText: item.alt_text,
              caption: item.caption,
              id: item.media_object_id,
            },
          ]
        : [],
    )
    const plan = createLocalEditorialRefreshPlan({
      content: createDemoSeedPlan().content,
      instagramMedia: media,
    })
    const result = await executeLocalEditorialRefresh({database, plan})

    process.stdout.write(`${JSON.stringify(result)}\n`)
  } finally {
    await database.$disconnect()
  }
}

main().catch(error => {
  const message =
    error instanceof Error &&
    /^LOCAL_EDITORIAL_[A-Z0-9_]+$/u.test(error.message)
      ? error.message
      : 'LOCAL_EDITORIAL_REFRESH_FAILED'

  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
