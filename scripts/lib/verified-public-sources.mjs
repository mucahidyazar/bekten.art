import {createHash} from 'node:crypto'

const SEED_CONFIRMATION = 'bekten-art-verified-public-sources'

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value

  for (const child of Object.values(value)) deepFreeze(child)

  return Object.freeze(value)
}

const verifiedPublicSources = deepFreeze([
  {
    body:
      'B’Art Contemporary and the Bishkek International Women’s Club welcomed more than one hundred visitors into a former Soviet-era art factory for an open studio tour. Bekten Usubaliev was among the participating Kyrgyz artists who met visitors and presented paintings, drawings and sculpture.',
    city: 'Bishkek',
    country: 'Kyrgyzstan',
    excerpt:
      'B’Art Contemporary documented Bekten Usubaliev among the artists presented during its 2015 Open Studio Tour in Bishkek.',
    key: 'open-studio-tour-2015',
    outlet: 'B’Art Contemporary',
    pressCategory: 'FEATURE',
    sourceUrl: 'https://www.bishkekart.kg/news/10/',
    startsAt: new Date('2015-12-05T05:00:00.000Z'),
    title: 'Open Studio Tour',
    venue: 'B’Art Contemporary studios',
  },
  {
    body:
      'An international TÜRKSOY plein-air programme in Aksaray brought together painters and graphic artists from eighteen countries. The resulting exhibition included five works made by Bekten Usubaliev in Aksaray, among them Hamam in Aksaray, The Old Mill and Scarlet Poppies of Belimçik.',
    city: 'Aksaray',
    country: 'Türkiye',
    excerpt:
      '24.kg reported Bekten Usubaliev’s participation in the 2015 TÜRKSOY plein-air exhibition in Aksaray, alongside artists from eighteen countries.',
    key: 'turksoy-aksaray-2015',
    outlet: '24.kg',
    pressCategory: 'NEWS',
    sourceUrl:
      'https://24.kg/kultura/17236_kyirgyizskiy_hudojnik_bekten_usubaliev_prinyal_uchastie_v_plenere_tyurksoy_/',
    startsAt: new Date('2015-08-03T12:00:00.000Z'),
    title: 'TÜRKSOY plein-air exhibition',
    venue: 'Aksaray exhibition hall',
  },
  {
    body:
      'The second part of Ten Stops on the Great Silk Road brought together ten Kyrgyz painters at Gallery M. Bekten Usubaliev participated in the exhibition, which used landscapes, portraits and scenes of historic trade routes to connect cultural memory across East and West.',
    city: 'Bishkek',
    country: 'Kyrgyzstan',
    excerpt:
      'Russian Gazette reported Bekten Usubaliev among the Kyrgyz painters participating in Ten Stops on the Great Silk Road at Gallery M.',
    key: 'ten-stops-silk-road-2021',
    outlet: 'Rossiyskaya Gazeta',
    pressCategory: 'FEATURE',
    sourceUrl:
      'https://rg.ru/2021/11/24/v-kirgizii-otkryli-vystavku-v-pamiat-o-hudozhnike-umershem-ot-covid-19.html',
    startsAt: new Date('2021-11-24T00:00:00.000Z'),
    title: 'Ten Stops on the Great Silk Road',
    venue: 'Gallery M',
  },
  {
    body:
      'Gallery M presented Spring Inspiration, a group exhibition of Kyrgyz painters. The public programme listed Bekten Usubaliev among the participating artists, together with Sapar Osmonaliev, Almagul Bolokova, Ormonali Idirisov and other artists working in Kyrgyzstan.',
    city: 'Bishkek',
    country: 'Kyrgyzstan',
    excerpt:
      'AKIpress listed Bekten Usubaliev among the participating artists in Gallery M’s Spring Inspiration exhibition in March 2023.',
    key: 'spring-inspiration-2023',
    outlet: 'AKIpress',
    pressCategory: 'NEWS',
    sourceUrl: 'https://presscenter.akipress.org/news%3A30237',
    startsAt: new Date('2023-03-20T04:00:00.000Z'),
    title: 'Spring Inspiration',
    venue: 'Gallery M',
  },
])

function stableUuid(identity) {
  const hash = createHash('sha256').update(identity).digest('hex').slice(0, 32)
  const value = `${hash.slice(0, 12)}4${hash.slice(13, 16)}8${hash.slice(17)}`

  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

function mediaPlacement(mediaObjectId, source) {
  return {
    altText: `A work by Bekten Usubaliev accompanying ${source.title}`,
    caption:
      'Contextual work from the artist’s verified Instagram archive; not presented as an installation photograph.',
    credit: 'Bekten Usubaliev · Instagram @bekten_usubaliev',
    crop: 'ORIGINAL',
    displayOrder: 0,
    mediaObjectId,
    role: 'HERO',
  }
}

function seo(source, section) {
  return {
    canonicalPath: `/${section}/${source.key}`,
    description: source.excerpt.slice(0, 170),
    noIndex: false,
    title: `${source.title} — Bekten Usubaliev`.slice(0, 70),
  }
}

function plannedSource(source, media, displayOrder) {
  const publishedAt = new Date(source.startsAt)
  const placement = mediaPlacement(media.id, source)
  const exhibitionId = stableUuid(`verified-public:exhibition:${source.key}`)
  const pressId = stableUuid(`verified-public:press:${source.key}`)
  const exhibitionSeo = seo(source, 'exhibitions')
  const pressSeo = seo(source, 'press')
  const exhibitionSnapshot = {
    body: source.body,
    city: source.city,
    country: source.country,
    displayOrder,
    endsAt: null,
    locale: 'en',
    mediaPlacements: [placement],
    seo: exhibitionSeo,
    slug: source.key,
    startsAt: source.startsAt.toISOString(),
    subtitle: source.outlet,
    title: source.title,
    venue: source.venue,
  }
  const pressSnapshot = {
    body: source.body,
    displayOrder,
    excerpt: source.excerpt,
    locale: 'en',
    mediaPlacements: [placement],
    outlet: source.outlet,
    pressCategory: source.pressCategory,
    publishedOn: source.startsAt.toISOString(),
    seo: pressSeo,
    slug: source.key,
    sourceUrl: source.sourceUrl,
    subtitle: source.venue,
    title: source.title,
  }

  return deepFreeze({
    exhibition: {
      placement: {
        ...placement,
        entityId: exhibitionId,
        entityType: 'EXHIBITION',
        id: stableUuid(`verified-public:exhibition-placement:${source.key}`),
      },
      revision: {
        entityId: exhibitionId,
        entityType: 'EXHIBITION',
        id: stableUuid(`verified-public:exhibition-revision:${source.key}`),
        locale: 'en',
        operation: 'PUBLISH',
        snapshot: exhibitionSnapshot,
        version: 1,
      },
      row: {
        body: source.body,
        city: source.city,
        country: source.country,
        displayOrder,
        endsAt: null,
        id: exhibitionId,
        locale: 'en',
        publishedAt,
        seoCanonicalPath: exhibitionSeo.canonicalPath,
        seoDescription: exhibitionSeo.description,
        seoNoIndex: false,
        seoTitle: exhibitionSeo.title,
        slug: source.key,
        startsAt: source.startsAt,
        status: 'PUBLISHED',
        subtitle: source.outlet,
        title: source.title,
        translationGroupId: exhibitionId,
        venue: source.venue,
        version: 1,
      },
    },
    press: {
      placement: {
        ...placement,
        entityId: pressId,
        entityType: 'PRESS_ENTRY',
        id: stableUuid(`verified-public:press-placement:${source.key}`),
      },
      revision: {
        entityId: pressId,
        entityType: 'PRESS_ENTRY',
        id: stableUuid(`verified-public:press-revision:${source.key}`),
        locale: 'en',
        operation: 'PUBLISH',
        snapshot: pressSnapshot,
        version: 1,
      },
      row: {
        category: source.pressCategory,
        content: source.body,
        description: source.excerpt,
        displayOrder,
        id: pressId,
        locale: 'en',
        outlet: source.outlet,
        publishedAt,
        publishedOn: source.startsAt,
        seoCanonicalPath: pressSeo.canonicalPath,
        seoDescription: pressSeo.description,
        seoNoIndex: false,
        seoTitle: pressSeo.title,
        slug: source.key,
        sourceUrl: source.sourceUrl,
        status: 'PUBLISHED',
        subtitle: source.venue,
        title: source.title,
        translationGroupId: pressId,
        version: 1,
      },
    },
    source,
  })
}

function createVerifiedPublicSourcePlan(mediaRows) {
  if (
    !Array.isArray(mediaRows) ||
    mediaRows.length < verifiedPublicSources.length ||
    mediaRows.some(
      row =>
        typeof row?.id !== 'string' ||
        row.status !== 'READY' ||
        row.visibility !== 'PUBLIC',
    )
  ) {
    throw new Error('VERIFIED_PUBLIC_SOURCE_MEDIA_NOT_READY')
  }

  return deepFreeze(
    verifiedPublicSources.map((source, index) =>
      plannedSource(source, mediaRows[index], index + 10),
    ),
  )
}

function assertVerifiedPublicSourceSeedAllowed(environment) {
  if (
    environment.ALLOW_VERIFIED_PUBLIC_SOURCE_SEED !== 'true' ||
    environment.VERIFIED_PUBLIC_SOURCE_SEED_CONFIRMATION !== SEED_CONFIRMATION
  ) {
    throw new Error('VERIFIED_PUBLIC_SOURCE_SEED_NOT_AUTHORIZED')
  }
}

async function createEntity(transaction, delegateName, item, source) {
  const inserted = await transaction[delegateName].createMany({
    data: [item.row],
    skipDuplicates: true,
  })

  if (inserted.count === 0) return false

  await transaction.contentMediaPlacement.create({data: item.placement})
  await transaction.contentRevision.create({data: item.revision})
  await transaction.auditEvent.create({
    data: {
      action: 'editorial.public-source-published',
      entityId: item.row.id,
      entityType: item.revision.entityType,
      metadata: {sourceOutlet: source.outlet, sourceUrl: source.sourceUrl},
      requestId: `verified-public:${item.revision.entityType}:${source.key}`,
    },
  })

  return true
}

async function executeVerifiedPublicSourceSeed({database, environment}) {
  assertVerifiedPublicSourceSeedAllowed(environment)

  const media = await database.mediaObject.findMany({
    orderBy: [{createdAt: 'asc'}, {id: 'asc'}],
    select: {id: true, status: true, visibility: true},
    take: verifiedPublicSources.length,
    where: {
      instagramPosts: {some: {is_active: true}},
      status: 'READY',
      visibility: 'PUBLIC',
    },
  })
  const plan = createVerifiedPublicSourcePlan(media)
  let created = 0
  let preserved = 0

  for (const item of plan) {
    const result = await database.$transaction(async transaction => {
      const exhibition = await createEntity(
        transaction,
        'exhibition',
        item.exhibition,
        item.source,
      )
      const press = await createEntity(
        transaction,
        'pressItem',
        item.press,
        item.source,
      )

      return Number(exhibition) + Number(press)
    })

    created += result
    preserved += 2 - result
  }

  return Object.freeze({created, preserved, sources: plan.length})
}

export {
  assertVerifiedPublicSourceSeedAllowed,
  createVerifiedPublicSourcePlan,
  executeVerifiedPublicSourceSeed,
  verifiedPublicSources,
}
