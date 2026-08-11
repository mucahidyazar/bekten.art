import {describe, expect, it} from 'vitest'

import {contentMediaPlacementRecordSchema} from './media-placement'

describe('content media placement contracts', () => {
  it('binds persisted placements to a supported editorial entity', () => {
    const record = contentMediaPlacementRecordSchema.parse({
      altText: 'A layered abstract composition in ochre and charcoal',
      createdAt: new Date('2026-08-10T10:00:00.000Z'),
      crop: 'ORIGINAL',
      displayOrder: 0,
      entityId: '71bbddf7-fc48-4395-8f36-9699410ced8a',
      entityType: 'ARTWORK',
      id: 'b8d58bca-d4bc-44cd-96bc-ef7d0387a69e',
      mediaObjectId: 'c33944f3-b5d8-49ed-a5cb-2e701a91be3c',
      role: 'HERO',
      updatedAt: new Date('2026-08-10T10:00:00.000Z'),
    })

    expect(record.entityType).toBe('ARTWORK')
    expect(record.entityId).toBe('71bbddf7-fc48-4395-8f36-9699410ced8a')
  })

  it('rejects placements bound to unknown entity types', () => {
    expect(() =>
      contentMediaPlacementRecordSchema.parse({
        altText: 'A layered abstract composition in ochre and charcoal',
        createdAt: new Date('2026-08-10T10:00:00.000Z'),
        crop: 'ORIGINAL',
        displayOrder: 0,
        entityId: '71bbddf7-fc48-4395-8f36-9699410ced8a',
        entityType: 'STORE_PRODUCT',
        id: 'b8d58bca-d4bc-44cd-96bc-ef7d0387a69e',
        mediaObjectId: 'c33944f3-b5d8-49ed-a5cb-2e701a91be3c',
        role: 'HERO',
        updatedAt: new Date('2026-08-10T10:00:00.000Z'),
      }),
    ).toThrow()
  })
})
