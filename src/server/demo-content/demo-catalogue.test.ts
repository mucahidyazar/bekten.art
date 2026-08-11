import {describe, expect, it} from 'vitest'

import {editorialEntityCodecs} from '@/server/editorial-persistence/editorial-entity-codecs'

import {createDemoSeedPlan} from '../../../scripts/lib/v2-demo-seed.mjs'

describe('V2 demo catalogue editorial contracts', () => {
  it('produces valid immutable public projections for every seeded entity', () => {
    const plan = createDemoSeedPlan()

    for (const item of plan.content) {
      const publicProjection = editorialEntityCodecs[
        item.entityType
      ].publicFromSnapshot(item.revision.snapshot, item.row.publishedAt)

      expect(publicProjection).toMatchObject({
        locale: item.row.locale,
        slug: item.row.slug,
        title: item.row.title,
      })
      expect(item.row.status).toBe('PUBLISHED')
      expect(item.row.version).toBe(item.revision.version)
      expect(Object.isFrozen(item.revision.snapshot)).toBe(true)
    }
  })

  it('keeps every placement attached to a declared immutable Garage asset', () => {
    const plan = createDemoSeedPlan()
    const mediaIds = new Set(plan.media.map(item => item.id))

    for (const item of plan.content) {
      const snapshotPlacements = item.revision.snapshot.mediaPlacements as
        readonly Readonly<{mediaObjectId: string}>[] | undefined

      expect(
        item.placements.every(placement =>
          mediaIds.has(placement.mediaObjectId),
        ),
      ).toBe(true)
      expect(
        snapshotPlacements?.map(placement => placement.mediaObjectId),
      ).toEqual(item.placements.map(placement => placement.mediaObjectId))
    }
  })
})
