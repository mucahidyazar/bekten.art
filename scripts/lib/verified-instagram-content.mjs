import {createHash} from 'node:crypto'

const EXPECTED_USERNAME = 'bekten_usubaliev'
const SEED_CONFIRMATION = 'bekten-art-verified-instagram'

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value))
    return value

  for (const child of Object.values(value)) deepFreeze(child)

  return Object.freeze(value)
}

const verifiedInstagramSources = deepFreeze([
  {
    caption: '«Весна в горах» 70/100, 2015г',
    dimensions: '70 × 100 cm',
    medium: null,
    shortcode: 'DYUdnfsMnvC',
    slug: 'spring-in-the-mountains',
    title: 'Весна в горах',
    year: 2015,
  },
  {
    caption: '«Горы Манжылы» холст/масло, 2012год, 80/60, Галерея М',
    dimensions: '80 × 60 cm',
    medium: 'Oil on canvas',
    shortcode: 'DU-R9rdDI1t',
    slug: 'mountains-of-manzhyly',
    title: 'Горы Манжылы',
    year: 2012,
  },
  {
    caption: '«Девочка с букетом», холст/масло, 50/60, 2020год, Галерея М',
    dimensions: '50 × 60 cm',
    medium: 'Oil on canvas',
    shortcode: 'DU-QaZBDGPt',
    slug: 'girl-with-a-bouquet',
    title: 'Девочка с букетом',
    year: 2020,
  },
  {
    caption: '“Күрмөнтүнүн тоолору” 100/60, холст/масло, 2025',
    dimensions: '100 × 60 cm',
    medium: 'Oil on canvas',
    shortcode: 'DTj73B5jDyc',
    slug: 'mountains-of-kurmontu',
    title: 'Күрмөнтүнүн тоолору',
    year: 2025,
  },
  {
    caption: '“Жамиля” 50/60, 2021',
    dimensions: '50 × 60 cm',
    medium: null,
    shortcode: 'DI8jCn4oyFQ',
    slug: 'jamilya',
    title: 'Жамиля',
    year: 2021,
  },
  {
    caption: '“Девушка с лимоном” 60/85, холст/ масло, 2015',
    dimensions: '60 × 85 cm',
    medium: 'Oil on canvas',
    shortcode: 'Czxql7IIz0J',
    slug: 'girl-with-a-lemon',
    title: 'Девушка с лимоном',
    year: 2015,
  },
  {
    caption: '“Ысык-Көлдө жай”, холст/масло, 55/45',
    dimensions: '55 × 45 cm',
    medium: 'Oil on canvas',
    shortcode: 'CzLRX_JImB4',
    slug: 'summer-at-issyk-kul',
    title: 'Ысык-Көлдө жай',
    year: null,
  },
  {
    caption: '«Перед дождем», 60/45, 2018г',
    dimensions: '60 × 45 cm',
    medium: null,
    shortcode: 'CzAq1ZHotpG',
    slug: 'before-the-rain',
    title: 'Перед дождем',
    year: 2018,
  },
  {
    caption: '“Эселейдин үйү”, холст/масло, 50/40, 2023',
    dimensions: '50 × 40 cm',
    medium: 'Oil on canvas',
    shortcode: 'Cy-tcLkIzjD',
    slug: 'eseleys-house',
    title: 'Эселейдин үйү',
    year: 2023,
  },
  {
    caption: '“Девочка с арбузом”, холст/масло, 70/90, 2023г',
    dimensions: '70 × 90 cm',
    medium: 'Oil on canvas',
    shortcode: 'CqdL2dqoyLx',
    slug: 'girl-with-a-watermelon',
    title: 'Девочка с арбузом',
    year: 2023,
  },
  {
    caption: '“Эски короо” холст/масло, 40/60',
    dimensions: '40 × 60 cm',
    medium: 'Oil on canvas',
    shortcode: 'CqYBrncoivP',
    slug: 'old-courtyard',
    title: 'Эски короо',
    year: null,
  },
  {
    caption: '“Лето на Иссыкуле”, холст/масло, 40/60',
    dimensions: '40 × 60 cm',
    medium: 'Oil on canvas',
    shortcode: 'CqS4CVMI6lt',
    slug: 'summer-on-issyk-kul',
    title: 'Лето на Иссыкуле',
    year: null,
  },
  {
    caption: '“Боз үй жана чеберлер”, холст/масло, 60/70',
    dimensions: '60 × 70 cm',
    medium: 'Oil on canvas',
    shortcode: 'CqNWMW9oQi3',
    slug: 'yurt-and-craftspeople',
    title: 'Боз үй жана чеберлер',
    year: null,
  },
  {
    caption: '“Тоо гулу”, холст/масло, 80/60, 2012г',
    dimensions: '80 × 60 cm',
    medium: 'Oil on canvas',
    shortcode: 'CqFYndXIGdI',
    slug: 'mountain-flower',
    title: 'Тоо гулу',
    year: 2012,
  },
  {
    caption: '«Цветы июля» холст/масло, 50/60, 2019г',
    dimensions: '50 × 60 cm',
    medium: 'Oil on canvas',
    shortcode: 'Cp9xt58ovso',
    slug: 'flowers-of-july',
    title: 'Цветы июля',
    year: 2019,
  },
  {
    caption: '«Подруги», холст масло, 50/60, 2019г',
    dimensions: '50 × 60 cm',
    medium: 'Oil on canvas',
    shortcode: 'CpzNKc0IM1C',
    slug: 'friends',
    title: 'Подруги',
    year: 2019,
  },
  {
    caption: '“Лето” 2012год',
    dimensions: null,
    medium: null,
    shortcode: 'CSjkRQosVaG',
    slug: 'summer-2012',
    title: 'Лето',
    year: 2012,
  },
  {
    caption: '“Юрта в степи. Невеста” 80/90, 2011 год',
    dimensions: '80 × 90 cm',
    medium: null,
    shortcode: 'CSeM4ngsCgG',
    slug: 'yurt-in-the-steppe-bride',
    title: 'Юрта в степи. Невеста',
    year: 2011,
  },
])

function stableUuid(identity) {
  const hash = createHash('sha256').update(identity).digest('hex').slice(0, 32)
  const value = `${hash.slice(0, 12)}4${hash.slice(13, 16)}8${hash.slice(17)}`

  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

function validInstagramPermalink(value, shortcode) {
  try {
    const parsed = new URL(value)

    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'www.instagram.com' &&
      !parsed.username &&
      !parsed.password &&
      parsed.pathname === `/p/${shortcode}/` &&
      !parsed.search &&
      !parsed.hash
    )
  } catch {
    return false
  }
}

function validSourceRow(row, source) {
  return (
    row?.caption?.trim() === source.caption &&
    row?.shortcode === source.shortcode &&
    row?.username === EXPECTED_USERNAME &&
    validInstagramPermalink(row?.source_permalink, source.shortcode) &&
    row?.media_object_id === row?.media_object?.id &&
    row?.media_object?.status === 'READY' &&
    row?.media_object?.visibility === 'PUBLIC' &&
    Number.isInteger(row?.media_object?.width) &&
    Number.isInteger(row?.media_object?.height)
  )
}

function sourceDescription(source) {
  const facts = [source.medium, source.dimensions, source.year]
    .filter(value => value !== null)
    .join(' · ')

  return `A source-linked work shared by Bekten Usubaliev through the artist’s Instagram archive.${facts ? ` ${facts}.` : ''}`
}

function seoDescription(source) {
  return `${source.title} by Bekten Usubaliev, documented through the artist’s official Instagram archive${source.year ? ` in ${source.year}` : ''}.`
}

function editablePlacement(row, source) {
  return {
    altText: `${source.title}, work by Bekten Usubaliev`,
    caption: source.caption,
    credit: 'Bekten Usubaliev · Instagram @bekten_usubaliev',
    crop: 'ORIGINAL',
    displayOrder: 0,
    mediaObjectId: row.media_object_id,
    role: 'HERO',
  }
}

function databasePlacement(entityId, entityType, placement, identity) {
  return {
    ...placement,
    entityId,
    entityType,
    id: stableUuid(`verified-instagram:placement:${identity}`),
  }
}

function collectionItem(firstArtwork, publishedAt) {
  const entityId = stableUuid('verified-instagram:collection:studio-archive')
  const description =
    'A source-linked selection of works documented through Bekten Usubaliev’s official Instagram archive.'
  const placement = editablePlacement(
    {media_object_id: firstArtwork.mediaObjectId},
    {
      caption: 'Selected work from the artist’s Instagram archive',
      title: 'Studio archive',
    },
  )
  const row = {
    description,
    displayOrder: 0,
    id: entityId,
    locale: 'en',
    publishedAt,
    seoCanonicalPath: '/collections/studio-archive',
    seoDescription: description,
    seoNoIndex: false,
    seoTitle: 'Studio archive — Bekten Usubaliev',
    slug: 'studio-archive',
    status: 'PUBLISHED',
    title: 'Studio archive',
    translationGroupId: entityId,
    version: 1,
  }
  const snapshot = {
    description,
    displayOrder: 0,
    locale: 'en',
    mediaPlacements: [placement],
    seo: {
      canonicalPath: '/collections/studio-archive',
      description,
      noIndex: false,
      title: row.seoTitle,
    },
    slug: row.slug,
    title: row.title,
  }

  return deepFreeze({
    entityId,
    placements: [
      databasePlacement(entityId, 'COLLECTION', placement, 'collection'),
    ],
    revision: {
      entityId,
      entityType: 'COLLECTION',
      id: stableUuid('verified-instagram:revision:collection'),
      locale: 'en',
      operation: 'PUBLISH',
      snapshot,
      version: 1,
    },
    row,
  })
}

function artworkItem(row, source, collectionId, publishedAt) {
  const entityId = stableUuid(`verified-instagram:artwork:${source.shortcode}`)
  const description = sourceDescription(source)
  const placement = editablePlacement(row, source)
  const sourceRecord = {
    provider: 'instagram',
    shortcode: source.shortcode,
    url: row.source_permalink,
  }
  const artworkRow = {
    availability: 'ON_REQUEST',
    collectionId,
    description,
    dimensions: source.dimensions,
    displayOrder: 0,
    id: entityId,
    isAvailable: true,
    locale: 'en',
    medium: source.medium,
    publishedAt,
    seoCanonicalPath: `/works/${source.slug}`,
    seoDescription: seoDescription(source),
    seoNoIndex: false,
    seoTitle: `${source.title} — Bekten Usubaliev`.slice(0, 70),
    slug: source.slug,
    status: 'PUBLISHED',
    title: source.title,
    translationGroupId: entityId,
    version: 1,
    year: source.year,
  }
  const snapshot = {
    availability: artworkRow.availability,
    collectionId,
    description,
    dimensions: source.dimensions,
    displayOrder: 0,
    locale: 'en',
    mediaPlacements: [placement],
    medium: source.medium,
    seo: {
      canonicalPath: artworkRow.seoCanonicalPath,
      description: artworkRow.seoDescription,
      noIndex: false,
      title: artworkRow.seoTitle,
    },
    slug: source.slug,
    title: source.title,
    year: source.year,
  }

  return deepFreeze({
    entityId,
    placements: [
      databasePlacement(entityId, 'ARTWORK', placement, source.shortcode),
    ],
    revision: {
      entityId,
      entityType: 'ARTWORK',
      id: stableUuid(`verified-instagram:revision:${source.shortcode}`),
      locale: 'en',
      operation: 'PUBLISH',
      snapshot,
      version: 1,
    },
    row: artworkRow,
    source: sourceRecord,
  })
}

function assertVerifiedInstagramSeedAllowed(environment) {
  if (
    environment.ALLOW_VERIFIED_INSTAGRAM_SEED !== 'true' ||
    environment.VERIFIED_INSTAGRAM_SEED_CONFIRMATION !== SEED_CONFIRMATION
  ) {
    throw new Error('VERIFIED_INSTAGRAM_SEED_NOT_AUTHORIZED')
  }
}

function createVerifiedInstagramSeedPlan(
  rows,
  {publishedAt = new Date()} = {},
) {
  const sourceByShortcode = new Map(
    verifiedInstagramSources.map(source => [source.shortcode, source]),
  )
  const accepted = []
  const rejected = []

  for (const row of rows) {
    const source = sourceByShortcode.get(row?.shortcode)

    if (!source || !validSourceRow(row, source)) {
      rejected.push(row?.shortcode ?? 'unknown')
      continue
    }

    accepted.push({row, source})
  }

  if (accepted.length === 0) {
    return deepFreeze({artworks: [], collection: null, rejected})
  }

  const first = accepted[0].row
  const provisionalCollectionId = stableUuid(
    'verified-instagram:collection:studio-archive',
  )
  const artworks = accepted.map(({row, source}) =>
    artworkItem(row, source, provisionalCollectionId, publishedAt),
  )
  const collection = collectionItem(
    {mediaObjectId: first.media_object_id},
    publishedAt,
  )

  return deepFreeze({artworks, collection, rejected})
}

function cacheJob(item, segment) {
  return {
    idempotencyKey: `editorial.cache-revalidate:${item.revision.entityType}:${item.entityId}:v1`,
    maxAttempts: 5,
    payload: {
      entityId: item.entityId,
      entityType: item.revision.entityType,
      locale: 'en',
      paths: ['/', `/${segment}`, `/${segment}/${item.row.slug}`],
      version: 1,
    },
    type: 'editorial.cache-revalidate',
  }
}

async function createCollection(transaction, collection) {
  const inserted = await transaction.collection.createMany({
    data: [collection.row],
    skipDuplicates: true,
  })

  if (inserted.count === 0) {
    const existing = await transaction.collection.findUnique({
      select: {id: true, version: true},
      where: {locale_slug: {locale: 'en', slug: collection.row.slug}},
    })

    if (!existing || existing.id !== collection.entityId) {
      throw new Error('VERIFIED_INSTAGRAM_COLLECTION_CONFLICT')
    }

    return false
  }

  if (inserted.count !== 1) {
    throw new Error('VERIFIED_INSTAGRAM_COLLECTION_WRITE_INVALID')
  }

  await transaction.contentMediaPlacement.createMany({
    data: collection.placements,
    skipDuplicates: true,
  })
  await transaction.contentRevision.createMany({
    data: [collection.revision],
    skipDuplicates: true,
  })
  await transaction.auditEvent.create({
    data: {
      action: 'editorial.instagram-collection-created',
      entityId: collection.entityId,
      entityType: 'COLLECTION',
      metadata: {provider: 'instagram'},
      requestId: 'verified-instagram:collection:studio-archive',
    },
  })
  await transaction.outboxJob.create({
    data: cacheJob(collection, 'collections'),
  })

  return true
}

async function createArtwork(transaction, artwork) {
  const inserted = await transaction.artwork.createMany({
    data: [artwork.row],
    skipDuplicates: true,
  })

  if (inserted.count === 0) {
    const existing = await transaction.artwork.findUnique({
      select: {id: true, version: true},
      where: {locale_slug: {locale: 'en', slug: artwork.row.slug}},
    })

    if (!existing) throw new Error('VERIFIED_INSTAGRAM_ARTWORK_CONFLICT')

    await transaction.auditEvent.create({
      data: {
        action: 'editorial.instagram-source-preserved',
        entityId: existing.id,
        entityType: 'ARTWORK',
        metadata: {
          preservedVersion: existing.version,
          sourceProvider: artwork.source.provider,
          sourceShortcode: artwork.source.shortcode,
          sourceUrl: artwork.source.url,
        },
        requestId: `verified-instagram:${artwork.source.shortcode}:preserved`,
      },
    })

    return false
  }

  if (inserted.count !== 1) {
    throw new Error('VERIFIED_INSTAGRAM_ARTWORK_WRITE_INVALID')
  }

  const placements = await transaction.contentMediaPlacement.createMany({
    data: artwork.placements,
    skipDuplicates: true,
  })
  const revisions = await transaction.contentRevision.createMany({
    data: [artwork.revision],
    skipDuplicates: true,
  })

  if (placements.count !== artwork.placements.length || revisions.count !== 1) {
    throw new Error('VERIFIED_INSTAGRAM_EDITORIAL_WRITE_CONFLICT')
  }

  await transaction.auditEvent.create({
    data: {
      action: 'editorial.instagram-source-published',
      entityId: artwork.entityId,
      entityType: 'ARTWORK',
      metadata: {
        sourceProvider: artwork.source.provider,
        sourceShortcode: artwork.source.shortcode,
        sourceUrl: artwork.source.url,
      },
      requestId: `verified-instagram:${artwork.source.shortcode}:published`,
    },
  })
  await transaction.outboxJob.create({data: cacheJob(artwork, 'works')})

  return true
}

function isStableSeedError(error) {
  return (
    error instanceof Error &&
    /^VERIFIED_INSTAGRAM_[A-Z0-9_]+$/u.test(error.message)
  )
}

async function executeVerifiedInstagramSeed({database, environment}) {
  assertVerifiedInstagramSeedAllowed(environment)

  try {
    const rows = await database.instagramPost.findMany({
      orderBy: [{posted_at: 'desc'}, {shortcode: 'asc'}],
      select: {
        caption: true,
        media_object: {
          select: {
            height: true,
            id: true,
            mimeType: true,
            status: true,
            visibility: true,
            width: true,
          },
        },
        media_object_id: true,
        posted_at: true,
        shortcode: true,
        source_permalink: true,
        username: true,
      },
      where: {
        is_active: true,
        shortcode: {in: verifiedInstagramSources.map(item => item.shortcode)},
      },
    })
    const plan = createVerifiedInstagramSeedPlan(rows)

    if (!plan.collection || plan.artworks.length === 0) {
      throw new Error('VERIFIED_INSTAGRAM_SOURCE_NOT_READY')
    }

    await database.$transaction(transaction =>
      createCollection(transaction, plan.collection),
    )

    let created = 0
    let existing = 0

    for (const artwork of plan.artworks) {
      const wasCreated = await database.$transaction(transaction =>
        createArtwork(transaction, artwork),
      )

      if (wasCreated) created += 1
      else existing += 1
    }

    return Object.freeze({
      created,
      existing,
      rejected: plan.rejected.length,
      sources: plan.artworks.length,
    })
  } catch (error) {
    if (isStableSeedError(error)) throw error

    throw new Error('VERIFIED_INSTAGRAM_SEED_FAILED')
  }
}

export {
  assertVerifiedInstagramSeedAllowed,
  createVerifiedInstagramSeedPlan,
  executeVerifiedInstagramSeed,
  verifiedInstagramSources,
}
