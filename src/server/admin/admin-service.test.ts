import {describe, expect, it, vi} from 'vitest'

import {AdminAuthorizationError, createAdminService} from './admin-service'

import type {AdminRepository} from './admin-repository'

function createRepository(): AdminRepository {
  return {
    getContactSummary: vi.fn().mockResolvedValue({
      contactLocales: [],
      feedback: {inReview: 0, new: 0, resolved: 0, total: 0},
      recentFeedback: [],
    }),
    getContentSummary: vi.fn().mockResolvedValue({collections: []}),
    getEmailSummary: vi.fn().mockResolvedValue({
      delivery: {completed: 0, failed: 0, pending: 0},
      recentSubscribers: [],
      subscribers: {active: 0, bounced: 0, pending: 0, total: 0, unsubscribed: 0},
    }),
    getMediaSummary: vi.fn().mockResolvedValue({
      instagram: {active: 0, lastSyncedAt: null, total: 0},
      media: {bytes: 0, failed: 0, ready: 0, total: 0, uploading: 0},
      recentMedia: [],
    }),
    getOverview: vi.fn().mockResolvedValue({
      metrics: {
        activeSubscribers: 0,
        mediaReady: 0,
        openFeedback: 0,
        publishedContent: 0,
        totalContent: 0,
        users: 0,
      },
      pipeline: {
        draftContent: 0,
        failedJobs: 0,
        pendingMedia: 0,
        pendingSubscribers: 0,
      },
      recentAudit: [],
    }),
    getSystemSummary: vi.fn().mockResolvedValue({
      auditEventsLast24Hours: 0,
      jobs: {completed: 0, failed: 0, pending: 0, processing: 0},
      latestAuditAt: null,
      rateLimitBuckets: 0,
      storage: {failed: 0, ready: 0, uploading: 0},
    }),
    listAuditEvents: vi.fn().mockResolvedValue({items: [], page: 1, pageSize: 25, total: 0}),
    listUsers: vi.fn().mockResolvedValue({items: [], page: 1, pageSize: 25, total: 0}),
  }
}

describe('admin service', () => {
  it('requires the matching database-backed capability before every read', async () => {
    const repository = createRepository()
    const requireCapability = vi.fn().mockResolvedValue({
      email: 'admin@bekten.art',
      id: 'admin-id',
      name: 'Studio Admin',
      role: 'ADMIN',
    })
    const service = createAdminService({
      environment: {},
      repository,
      requireCapability,
    })

    await service.getOverview()
    await service.getContentSummary()
    await service.getMediaSummary()
    await service.getContactSummary()
    await service.getEmailSummary()
    await service.getSystemSummary()
    await service.listUsers({page: '2', query: '  bekten  '})
    await service.listAuditEvents({entityType: ' artwork ', page: '3'})

    expect(requireCapability.mock.calls.map(([capability]) => capability)).toEqual([
      'VIEW_DASHBOARD',
      'VIEW_CONTENT',
      'VIEW_MEDIA',
      'VIEW_CONTACT',
      'VIEW_EMAIL',
      'VIEW_SYSTEM',
      'VIEW_USERS',
      'VIEW_AUDIT',
    ])
    expect(repository.listUsers).toHaveBeenCalledWith({
      page: 2,
      pageSize: 25,
      query: 'bekten',
    })
    expect(repository.listAuditEvents).toHaveBeenCalledWith({
      entityType: 'artwork',
      page: 3,
      pageSize: 25,
      query: '',
    })
  })

  it('rejects invalid pagination before querying the repository', async () => {
    const repository = createRepository()
    const service = createAdminService({
      environment: {},
      repository,
      requireCapability: vi.fn().mockResolvedValue({
        email: null,
        id: 'admin-id',
        name: null,
        role: 'ADMIN',
      }),
    })

    await expect(service.listUsers({page: '-1'})).rejects.toThrow('Invalid admin list query')
    expect(repository.listUsers).not.toHaveBeenCalled()
  })

  it('exposes configuration health without leaking secret values', async () => {
    const repository = createRepository()
    const service = createAdminService({
      environment: {
        AUTH_GOOGLE_ID: 'google-id',
        AUTH_GOOGLE_SECRET: 'google-secret',
        DATABASE_URL: 'postgresql://secret',
        MEDIA_S3_ACCESS_KEY_ID: 'garage-key',
        MEDIA_S3_BUCKET: 'bekten-art-private-media',
        MEDIA_S3_ENDPOINT: 'https://s3.example.test',
        MEDIA_S3_REGION: 'garage',
        MEDIA_S3_SECRET_ACCESS_KEY: 'garage-secret',
        NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: 'G-TEST',
        NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: 'GTM-TEST',
        RESEND_API_KEY: 're_secret',
        RESEND_FROM_EMAIL: 'noreply@mucahid.dev',
      },
      repository,
      requireCapability: vi.fn().mockResolvedValue({
        email: null,
        id: 'admin-id',
        name: null,
        role: 'ADMIN',
      }),
    })

    const summary = await service.getSystemSummary()
    const serialized = JSON.stringify(summary)

    expect(summary.configuration.every(item => item.configured)).toBe(true)
    expect(serialized).not.toContain('postgresql://secret')
    expect(serialized).not.toContain('garage-secret')
    expect(serialized).not.toContain('re_secret')
    expect(serialized).not.toContain('google-secret')
  })

  it('uses a typed authorization error for non-admin actors', async () => {
    const repository = createRepository()
    const service = createAdminService({
      environment: {},
      repository,
      requireCapability: vi.fn().mockRejectedValue(new AdminAuthorizationError()),
    })

    await expect(service.getOverview()).rejects.toBeInstanceOf(AdminAuthorizationError)
    expect(repository.getOverview).not.toHaveBeenCalled()
  })
})
