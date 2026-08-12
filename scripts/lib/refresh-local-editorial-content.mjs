const EXEMPT_IDENTITIES = new Set([
  'COLLECTION',
  'PAGE:about',
  'PAGE:contact',
  'PAGE:home',
])

function isExempt(item) {
  return (
    EXEMPT_IDENTITIES.has(item.entityType) ||
    EXEMPT_IDENTITIES.has(`${item.entityType}:${item.row.slug}`)
  )
}

function placementFor(item, media) {
  const current = item.placements[0] ?? {}
  const caption = media.caption?.trim().slice(0, 1000) || null

  return {
    ...current,
    altText: media.altText?.trim().slice(0, 300) || item.row.title,
    caption,
    credit: 'Bekten Usubaliev · Instagram archive',
    crop: 'ORIGINAL',
    displayOrder: 0,
    entityId: item.entityId,
    entityType: item.entityType,
    mediaObjectId: media.id,
    role: 'HERO',
  }
}

function revisionMediaPlacement(placement) {
  return {
    altText: placement.altText,
    caption: placement.caption ?? null,
    credit: placement.credit ?? null,
    crop: placement.crop,
    displayOrder: placement.displayOrder,
    focalPoint: placement.focalPoint ?? null,
    mediaObjectId: placement.mediaObjectId,
    role: placement.role,
  }
}

function stripImmutableRowFields(row) {
  const update = Object.fromEntries(
    Object.entries(row).filter(
      ([key]) => !['createdAt', 'id', 'updatedAt'].includes(key),
    ),
  )

  return {...update, version: 2}
}

export function assertLocalEditorialRefreshAllowed(environment) {
  if (
    environment.NODE_ENV !== 'development' ||
    environment.ALLOW_LOCAL_EDITORIAL_REFRESH !== 'true'
  ) {
    throw new Error('LOCAL_EDITORIAL_REFRESH_FORBIDDEN')
  }
}

export function createLocalEditorialRefreshPlan({content, instagramMedia}) {
  if (!Array.isArray(instagramMedia) || instagramMedia.length === 0) {
    throw new Error('LOCAL_EDITORIAL_MEDIA_UNAVAILABLE')
  }

  const translationGroups = [
    ...new Set(
      content
        .filter(item => !isExempt(item))
        .map(item => item.row.translationGroupId),
    ),
  ].sort()
  const mediaByGroup = new Map(
    translationGroups.map((translationGroupId, index) => [
      translationGroupId,
      instagramMedia[index % instagramMedia.length],
    ]),
  )

  return content.map(item => {
    const media = mediaByGroup.get(item.row.translationGroupId)
    const placements = isExempt(item)
      ? item.placements.map(placement => ({...placement}))
      : [placementFor(item, media)]
    const snapshot = {
      ...item.revision.snapshot,
      mediaPlacements: placements.map(revisionMediaPlacement),
    }

    return {
      ...item,
      placements,
      revision: {
        entityId: item.entityId,
        entityType: item.entityType,
        locale: item.revision.locale,
        operation: 'PUBLISH',
        snapshot,
        version: 2,
      },
      row: {...item.row, version: 2},
      update: stripImmutableRowFields(item.row),
    }
  })
}

export async function executeLocalEditorialRefresh({database, plan}) {
  return database.$transaction(async transaction => {
    let preserved = 0
    let refreshed = 0

    for (const item of plan) {
      const delegate = transaction[item.delegate]
      const current = await delegate.findUnique({
        select: {id: true, version: true},
        where: {id: item.entityId},
      })

      if (!current || current.version !== 1) {
        preserved += 1
        continue
      }

      const update = await delegate.updateMany({
        data: item.update,
        where: {id: item.entityId, version: 1},
      })

      if (update.count !== 1)
        throw new Error('LOCAL_EDITORIAL_REFRESH_CONFLICT')

      await transaction.contentMediaPlacement.deleteMany({
        where: {entityId: item.entityId, entityType: item.entityType},
      })
      if (item.placements.length > 0) {
        await transaction.contentMediaPlacement.createMany({
          data: item.placements.map(({id: _id, ...placement}) => placement),
        })
      }
      await transaction.contentRevision.create({data: item.revision})

      await transaction.auditEvent.create({
        data: {
          action: 'editorial.local-content-refreshed',
          entityId: item.entityId,
          entityType: item.entityType,
          metadata: {identity: item.identity, version: 2},
          requestId: `local-editorial-refresh:${item.entityId}`,
        },
      })
      refreshed += 1
    }

    return Object.freeze({preserved, refreshed})
  })
}
