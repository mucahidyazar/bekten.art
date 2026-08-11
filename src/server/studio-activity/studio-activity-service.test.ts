import {describe, expect, it, vi} from 'vitest'

import {createStudioActivityService} from './studio-activity-service'

describe('Studio activity service', () => {
  it('validates bounded filters and strips sensitive metadata', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue({
        events: [
          {
            action: 'media.uploaded',
            actor: {email: 'owner@example.com', name: 'Owner'},
            actorUserId: '11111111-1111-4111-8111-111111111111',
            createdAt: new Date('2026-08-11T12:00:00.000Z'),
            entityId: 'media-1',
            entityType: 'MediaObject',
            id: '22222222-2222-4222-8222-222222222222',
            metadata: {
              contentType: 'image/webp',
              objectKey: 'private/secret.webp',
              signInUrlEncrypted: 'secret',
              sizeBytes: 1200,
            },
          },
        ],
        total: 1,
      }),
    }
    const service = createStudioActivityService(repository)
    const result = await service.list({action: 'media.', page: 1})

    expect(repository.list).toHaveBeenCalledWith({
      action: 'media.',
      page: 1,
      pageSize: 50,
    })
    expect(result.events[0].metadata).toEqual({
      contentType: 'image/webp',
      sizeBytes: 1200,
    })
    expect(JSON.stringify(result)).not.toContain('secret')
    expect(JSON.stringify(result)).not.toContain('objectKey')
  })

  it('rejects malformed date and unbounded filters', async () => {
    const repository = {list: vi.fn()}
    const service = createStudioActivityService(repository)

    await expect(
      service.list({action: 'x'.repeat(200), from: 'not-a-date'}),
    ).rejects.toThrow('STUDIO_ACTIVITY_FILTER_INVALID')
    expect(repository.list).not.toHaveBeenCalled()
  })
})
