import {describe, expect, it, vi} from 'vitest'

import {createDatabaseAdminRepository} from './database-admin-repository'

describe('database admin repository', () => {
  it('returns server-side searched and paginated users with safe fields only', async () => {
    const count = vi.fn().mockResolvedValue(1)
    const findMany = vi.fn().mockResolvedValue([
      {
        accounts: [{provider: 'google'}],
        created_at: new Date('2026-08-01T10:00:00.000Z'),
        email: 'bekten@example.com',
        emailVerified: new Date('2026-08-01T10:05:00.000Z'),
        id: '00000000-0000-4000-8000-000000000001',
        last_sign_in_at: new Date('2026-08-08T12:00:00.000Z'),
        name: 'Bekten',
        role: 'ARTIST',
        updated_at: new Date('2026-08-08T12:00:00.000Z'),
      },
    ])
    const repository = createDatabaseAdminRepository({
      user: {count, findMany},
    })

    await expect(
      repository.listUsers({page: 2, pageSize: 25, query: 'bekten'}),
    ).resolves.toEqual({
      items: [
        {
          createdAt: new Date('2026-08-01T10:00:00.000Z'),
          email: 'bekten@example.com',
          emailVerified: true,
          id: '00000000-0000-4000-8000-000000000001',
          lastSignInAt: new Date('2026-08-08T12:00:00.000Z'),
          name: 'Bekten',
          providers: ['google'],
          role: 'ARTIST',
          updatedAt: new Date('2026-08-08T12:00:00.000Z'),
        },
      ],
      page: 2,
      pageSize: 25,
      total: 1,
    })
    expect(count).toHaveBeenCalledWith({
      where: {
        OR: [
          {email: {contains: 'bekten', mode: 'insensitive'}},
          {name: {contains: 'bekten', mode: 'insensitive'}},
        ],
      },
    })
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({skip: 25, take: 25}),
    )
  })

  it('maps durable audit rows and actor identity without exposing metadata internals', async () => {
    const count = vi.fn().mockResolvedValue(1)
    const findMany = vi.fn().mockResolvedValue([
      {
        action: 'content.publish',
        actorUser: {email: 'admin@example.com', name: 'Admin'},
        actorUserId: '00000000-0000-4000-8000-000000000001',
        createdAt: new Date('2026-08-09T09:00:00.000Z'),
        entityId: 'artwork-1',
        entityType: 'Artwork',
        id: '00000000-0000-4000-8000-000000000002',
        requestId: 'request-1',
      },
    ])
    const repository = createDatabaseAdminRepository({
      auditEvent: {
        count,
        findFirst: vi.fn().mockResolvedValue(null),
        findMany,
      },
    })

    await expect(
      repository.listAuditEvents({
        entityType: 'artwork',
        page: 1,
        pageSize: 25,
        query: 'publish',
      }),
    ).resolves.toEqual({
      items: [
        {
          action: 'content.publish',
          actor: {email: 'admin@example.com', name: 'Admin'},
          actorUserId: '00000000-0000-4000-8000-000000000001',
          createdAt: new Date('2026-08-09T09:00:00.000Z'),
          entityId: 'artwork-1',
          entityType: 'Artwork',
          id: '00000000-0000-4000-8000-000000000002',
          requestId: 'request-1',
        },
      ],
      page: 1,
      pageSize: 25,
      total: 1,
    })
    expect(count).toHaveBeenCalledWith({
      where: {
        action: {contains: 'publish', mode: 'insensitive'},
        entityType: {equals: 'artwork', mode: 'insensitive'},
      },
    })
  })

  it('aggregates content statuses from real typed content tables', async () => {
    const model = (rows: readonly Readonly<{_count: {_all: number}; status: string}>[]) => ({
      groupBy: vi.fn().mockResolvedValue(rows),
    })
    const repository = createDatabaseAdminRepository({
      artistStat: model([{_count: {_all: 2}, status: 'PUBLISHED'}]),
      artwork: model([
        {_count: {_all: 4}, status: 'PUBLISHED'},
        {_count: {_all: 1}, status: 'DRAFT'},
      ]),
      memory: model([]),
      newsArticle: model([{_count: {_all: 3}, status: 'DRAFT'}]),
      pressItem: model([]),
      testimonial: model([{_count: {_all: 2}, status: 'ARCHIVED'}]),
      workshopItem: model([{_count: {_all: 1}, status: 'PUBLISHED'}]),
    })

    const summary = await repository.getContentSummary()

    expect(summary.collections.find(item => item.key === 'artworks')).toEqual({
      archived: 0,
      draft: 1,
      key: 'artworks',
      label: 'Artworks',
      published: 4,
      total: 5,
    })
    expect(summary.collections.reduce((total, item) => total + item.total, 0)).toBe(13)
  })

  it('aggregates every supported transactional email job type', async () => {
    const outboxGroupBy = vi.fn().mockResolvedValue([
      {_count: {_all: 2}, status: 'PENDING'},
      {_count: {_all: 1}, status: 'FAILED'},
    ])
    const repository = createDatabaseAdminRepository({
      newsletterSubscriber: {
        findMany: vi.fn().mockResolvedValue([]),
        groupBy: vi.fn().mockResolvedValue([]),
      },
      outboxJob: {
        count: vi.fn(),
        groupBy: outboxGroupBy,
      },
    })

    await expect(repository.getEmailSummary()).resolves.toMatchObject({
      delivery: {completed: 0, failed: 1, pending: 2},
    })
    expect(outboxGroupBy).toHaveBeenCalledWith({
      _count: {_all: true},
      by: ['status'],
      where: {
        type: {
          in: [
            'auth.email_verification',
            'auth.password_reset',
            'feedback.created',
            'newsletter.confirmation_requested',
            'newsletter.welcome',
          ],
        },
      },
    })
  })
})
