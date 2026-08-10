import {TRANSACTIONAL_EMAIL_JOB_TYPES} from '@/server/email/job-types'

import type {
  AdminAuditQuery,
  AdminAuditRow,
  AdminContactSummary,
  AdminContentCollection,
  AdminContentSummary,
  AdminEmailSummary,
  AdminListQuery,
  AdminMediaSummary,
  AdminOverview,
  AdminPaginated,
  AdminRepository,
  AdminSystemData,
  AdminUserRow,
} from './admin-repository'

type CountDelegate = Readonly<{
  count: (args?: unknown) => Promise<number>
}>

type FindManyDelegate = Readonly<{
  findMany: (args: unknown) => Promise<readonly Record<string, unknown>[]>
}>

type GroupByDelegate = Readonly<{
  groupBy: (args: unknown) => Promise<readonly Record<string, unknown>[]>
}>

type FindFirstDelegate = Readonly<{
  findFirst: (args: unknown) => Promise<Record<string, unknown> | null>
}>

type AggregateDelegate = Readonly<{
  aggregate: (args: unknown) => Promise<Record<string, unknown>>
}>

type ListModel = CountDelegate & FindManyDelegate
type StatusModel = GroupByDelegate

export type AdminDatabase = Partial<{
  artistStat: StatusModel
  artwork: StatusModel
  auditEvent: CountDelegate & FindManyDelegate & FindFirstDelegate
  contactInfo: FindManyDelegate
  feedback: GroupByDelegate & FindManyDelegate
  instagramPost: CountDelegate & FindFirstDelegate
  mediaObject: GroupByDelegate & FindManyDelegate & AggregateDelegate
  memory: StatusModel
  newsArticle: StatusModel
  newsletterSubscriber: GroupByDelegate & FindManyDelegate
  outboxJob: CountDelegate & GroupByDelegate
  pressItem: StatusModel
  rateLimitBucket: CountDelegate
  testimonial: StatusModel
  user: ListModel
  workshopItem: StatusModel
}>

function required<T>(value: T | undefined, model: string): T {
  if (!value) {
    throw new Error(`${model} database delegate is not configured`)
  }

  return value
}

function stringValue(row: Record<string, unknown>, key: string) {
  const value = row[key]

  if (typeof value !== 'string') throw new Error(`Invalid ${key} database value`)

  return value
}

function nullableString(row: Record<string, unknown>, key: string) {
  const value = row[key]

  if (value !== null && typeof value !== 'string') {
    throw new Error(`Invalid ${key} database value`)
  }

  return value
}

function dateValue(row: Record<string, unknown>, key: string) {
  const value = row[key]

  if (!(value instanceof Date)) throw new Error(`Invalid ${key} database value`)

  return value
}

function nullableDate(row: Record<string, unknown>, key: string) {
  const value = row[key]

  if (value !== null && !(value instanceof Date)) {
    throw new Error(`Invalid ${key} database value`)
  }

  return value
}

function numberValue(row: Record<string, unknown>, key: string) {
  const value = row[key]

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid ${key} database value`)
  }

  return value
}

function statusCounts(rows: readonly Record<string, unknown>[]) {
  const counts = {ARCHIVED: 0, DRAFT: 0, PUBLISHED: 0}

  for (const row of rows) {
    const status = stringValue(row, 'status')
    const count = row._count

    if (!(status in counts) || typeof count !== 'object' || count === null) continue
    const total = (count as Record<string, unknown>)._all

    if (typeof total === 'number') counts[status as keyof typeof counts] = total
  }

  return Object.freeze(counts)
}

function genericStatusCounts(rows: readonly Record<string, unknown>[]) {
  const counts = new Map<string, number>()

  for (const row of rows) {
    const status = stringValue(row, 'status')
    const count = row._count

    if (typeof count !== 'object' || count === null) continue
    const total = (count as Record<string, unknown>)._all

    if (typeof total === 'number') counts.set(status, total)
  }

  return counts
}

function contentCollection(
  key: AdminContentCollection['key'],
  label: string,
  rows: readonly Record<string, unknown>[],
) {
  const counts = statusCounts(rows)

  return Object.freeze({
    archived: counts.ARCHIVED,
    draft: counts.DRAFT,
    key,
    label,
    published: counts.PUBLISHED,
    total: counts.ARCHIVED + counts.DRAFT + counts.PUBLISHED,
  })
}

function contentGroup(model: StatusModel | undefined) {
  return required(model, 'content').groupBy({
    _count: {_all: true},
    by: ['status'],
  })
}

function userWhere(query: string) {
  return query
    ? {
        OR: [
          {email: {contains: query, mode: 'insensitive'}},
          {name: {contains: query, mode: 'insensitive'}},
        ],
      }
    : {}
}

function auditWhere(query: AdminAuditQuery) {
  return {
    ...(query.query
      ? {action: {contains: query.query, mode: 'insensitive'}}
      : {}),
    ...(query.entityType
      ? {entityType: {equals: query.entityType, mode: 'insensitive'}}
      : {}),
  }
}

function mapUser(row: Record<string, unknown>): AdminUserRow {
  const accounts = Array.isArray(row.accounts) ? row.accounts : []

  return Object.freeze({
    createdAt: dateValue(row, 'created_at'),
    email: nullableString(row, 'email'),
    emailVerified: row.emailVerified instanceof Date,
    id: stringValue(row, 'id'),
    lastSignInAt: nullableDate(row, 'last_sign_in_at'),
    name: nullableString(row, 'name'),
    providers: Object.freeze(
      accounts.flatMap(account =>
        typeof account === 'object' && account !== null && typeof account.provider === 'string'
          ? [account.provider]
          : [],
      ),
    ),
    role: stringValue(row, 'role') as AdminUserRow['role'],
    updatedAt: dateValue(row, 'updated_at'),
  })
}

function mapAudit(row: Record<string, unknown>): AdminAuditRow {
  const actor = row.actorUser

  return Object.freeze({
    action: stringValue(row, 'action'),
    actor:
      typeof actor === 'object' && actor !== null
        ? Object.freeze({
            email: nullableString(actor as Record<string, unknown>, 'email'),
            name: nullableString(actor as Record<string, unknown>, 'name'),
          })
        : null,
    actorUserId: nullableString(row, 'actorUserId'),
    createdAt: dateValue(row, 'createdAt'),
    entityId: nullableString(row, 'entityId'),
    entityType: stringValue(row, 'entityType'),
    id: stringValue(row, 'id'),
    requestId: nullableString(row, 'requestId'),
  })
}

export function createDatabaseAdminRepository(database: AdminDatabase): AdminRepository {
  async function getContentSummary(): Promise<AdminContentSummary> {
    const rows = await Promise.all([
      contentGroup(database.artistStat),
      contentGroup(database.artwork),
      contentGroup(database.memory),
      contentGroup(database.newsArticle),
      contentGroup(database.pressItem),
      contentGroup(database.testimonial),
      contentGroup(database.workshopItem),
    ])

    return Object.freeze({
      collections: Object.freeze([
        contentCollection('artistStats', 'Artist statistics', rows[0]),
        contentCollection('artworks', 'Artworks', rows[1]),
        contentCollection('memories', 'Memories', rows[2]),
        contentCollection('newsArticles', 'News articles', rows[3]),
        contentCollection('pressItems', 'Press', rows[4]),
        contentCollection('testimonials', 'Testimonials', rows[5]),
        contentCollection('workshopItems', 'Workshops', rows[6]),
      ]),
    })
  }

  async function listAuditEvents(
    query: AdminAuditQuery,
  ): Promise<AdminPaginated<AdminAuditRow>> {
    const model = required(database.auditEvent, 'AuditEvent')
    const where = auditWhere(query)
    const [total, rows] = await Promise.all([
      model.count({where}),
      model.findMany({
        orderBy: {createdAt: 'desc'},
        select: {
          action: true,
          actorUser: {select: {email: true, name: true}},
          actorUserId: true,
          createdAt: true,
          entityId: true,
          entityType: true,
          id: true,
          requestId: true,
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        where,
      }),
    ])

    return Object.freeze({
      items: Object.freeze(rows.map(mapAudit)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    })
  }

  async function getMediaSummary(): Promise<AdminMediaSummary> {
    const media = required(database.mediaObject, 'MediaObject')
    const instagram = required(database.instagramPost, 'InstagramPost')
    const [statusRows, aggregate, recent, instagramTotal, instagramActive, latestSync] =
      await Promise.all([
        media.groupBy({_count: {_all: true}, by: ['status']}),
        media.aggregate({_sum: {sizeBytes: true}}),
        media.findMany({orderBy: {createdAt: 'desc'}, take: 10}),
        instagram.count(),
        instagram.count({where: {is_active: true}}),
        instagram.findFirst({orderBy: {synced_at: 'desc'}, select: {synced_at: true}}),
      ])
    const counts = genericStatusCounts(statusRows)
    const sum = aggregate._sum as Record<string, unknown> | null | undefined
    const bytes =
      typeof sum === 'object' && sum !== null && typeof sum.sizeBytes === 'number'
        ? sum.sizeBytes
        : 0

    return Object.freeze({
      instagram: Object.freeze({
        active: instagramActive,
        lastSyncedAt: latestSync ? dateValue(latestSync, 'synced_at') : null,
        total: instagramTotal,
      }),
      media: Object.freeze({
        bytes,
        failed: (counts.get('FAILED') ?? 0) + (counts.get('QUARANTINED') ?? 0),
        ready: counts.get('READY') ?? 0,
        total: [...counts.values()].reduce((sumValue, value) => sumValue + value, 0),
        uploading: counts.get('UPLOADING') ?? 0,
      }),
      recentMedia: Object.freeze(
        recent.map(row =>
          Object.freeze({
            createdAt: dateValue(row, 'createdAt'),
            filename: stringValue(row, 'filename'),
            id: stringValue(row, 'id'),
            mimeType: stringValue(row, 'mimeType'),
            provider: stringValue(row, 'provider'),
            sizeBytes: numberValue(row, 'sizeBytes'),
            status: stringValue(row, 'status') as 'FAILED' | 'QUARANTINED' | 'READY' | 'UPLOADING',
            visibility: stringValue(row, 'visibility') as 'PRIVATE' | 'PUBLIC',
          }),
        ),
      ),
    })
  }

  async function getContactSummary(): Promise<AdminContactSummary> {
    const contacts = required(database.contactInfo, 'ContactInfo')
    const feedback = required(database.feedback, 'Feedback')
    const [contactRows, feedbackGroups, feedbackRows] = await Promise.all([
      contacts.findMany({orderBy: [{isPrimary: 'desc'}, {locale: 'asc'}]}),
      feedback.groupBy({_count: {_all: true}, by: ['status']}),
      feedback.findMany({orderBy: {createdAt: 'desc'}, take: 10}),
    ])
    const counts = genericStatusCounts(feedbackGroups)

    return Object.freeze({
      contactLocales: Object.freeze(
        contactRows.map(row =>
          Object.freeze({
            address: stringValue(row, 'address'),
            email: stringValue(row, 'email'),
            isPrimary: row.isPrimary === true,
            locale: stringValue(row, 'locale'),
            phone: stringValue(row, 'phone'),
            updatedAt: dateValue(row, 'updatedAt'),
            workingHours: nullableString(row, 'workingHours'),
          }),
        ),
      ),
      feedback: Object.freeze({
        inReview: counts.get('IN_REVIEW') ?? 0,
        new: counts.get('NEW') ?? 0,
        resolved: counts.get('RESOLVED') ?? 0,
        total: [...counts.values()].reduce((sum, value) => sum + value, 0),
      }),
      recentFeedback: Object.freeze(
        feedbackRows.map(row =>
          Object.freeze({
            createdAt: dateValue(row, 'createdAt'),
            email: stringValue(row, 'email'),
            id: stringValue(row, 'id'),
            name: stringValue(row, 'name'),
            status: stringValue(row, 'status') as 'IN_REVIEW' | 'NEW' | 'RESOLVED' | 'SPAM',
            subject: stringValue(row, 'subject'),
          }),
        ),
      ),
    })
  }

  async function getEmailSummary(): Promise<AdminEmailSummary> {
    const subscribers = required(database.newsletterSubscriber, 'NewsletterSubscriber')
    const outbox = required(database.outboxJob, 'OutboxJob')
    const [subscriberGroups, recentSubscribers, deliveryGroups] = await Promise.all([
      subscribers.groupBy({_count: {_all: true}, by: ['status']}),
      subscribers.findMany({orderBy: {createdAt: 'desc'}, take: 10}),
      outbox.groupBy({
        _count: {_all: true},
        by: ['status'],
        where: {type: {in: [...TRANSACTIONAL_EMAIL_JOB_TYPES]}},
      }),
    ])
    const subscriberCounts = genericStatusCounts(subscriberGroups)
    const deliveryCounts = genericStatusCounts(deliveryGroups)

    return Object.freeze({
      delivery: Object.freeze({
        completed: deliveryCounts.get('COMPLETED') ?? 0,
        failed: deliveryCounts.get('FAILED') ?? 0,
        pending:
          (deliveryCounts.get('PENDING') ?? 0) +
          (deliveryCounts.get('PROCESSING') ?? 0),
      }),
      recentSubscribers: Object.freeze(
        recentSubscribers.map(row =>
          Object.freeze({
            confirmedAt: nullableDate(row, 'confirmedAt'),
            createdAt: dateValue(row, 'createdAt'),
            email: stringValue(row, 'email'),
            id: stringValue(row, 'id'),
            locale: stringValue(row, 'locale'),
            source: stringValue(row, 'source'),
            status: stringValue(row, 'status') as 'ACTIVE' | 'BOUNCED' | 'PENDING' | 'UNSUBSCRIBED',
          }),
        ),
      ),
      subscribers: Object.freeze({
        active: subscriberCounts.get('ACTIVE') ?? 0,
        bounced: subscriberCounts.get('BOUNCED') ?? 0,
        pending: subscriberCounts.get('PENDING') ?? 0,
        total: [...subscriberCounts.values()].reduce((sum, value) => sum + value, 0),
        unsubscribed: subscriberCounts.get('UNSUBSCRIBED') ?? 0,
      }),
    })
  }

  async function getSystemSummary(): Promise<AdminSystemData> {
    const audit = required(database.auditEvent, 'AuditEvent')
    const jobs = required(database.outboxJob, 'OutboxJob')
    const limits = required(database.rateLimitBucket, 'RateLimitBucket')
    const media = required(database.mediaObject, 'MediaObject')
    const since = new Date(Date.now() - 24 * 60 * 60 * 1_000)
    const [auditCount, latestAudit, jobGroups, rateLimitBuckets, mediaGroups] =
      await Promise.all([
        audit.count({where: {createdAt: {gte: since}}}),
        audit.findFirst({orderBy: {createdAt: 'desc'}, select: {createdAt: true}}),
        jobs.groupBy({_count: {_all: true}, by: ['status']}),
        limits.count(),
        media.groupBy({_count: {_all: true}, by: ['status']}),
      ])
    const jobCounts = genericStatusCounts(jobGroups)
    const mediaCounts = genericStatusCounts(mediaGroups)

    return Object.freeze({
      auditEventsLast24Hours: auditCount,
      jobs: Object.freeze({
        completed: jobCounts.get('COMPLETED') ?? 0,
        failed: jobCounts.get('FAILED') ?? 0,
        pending: jobCounts.get('PENDING') ?? 0,
        processing: jobCounts.get('PROCESSING') ?? 0,
      }),
      latestAuditAt: latestAudit ? dateValue(latestAudit, 'createdAt') : null,
      rateLimitBuckets,
      storage: Object.freeze({
        failed:
          (mediaCounts.get('FAILED') ?? 0) + (mediaCounts.get('QUARANTINED') ?? 0),
        ready: mediaCounts.get('READY') ?? 0,
        uploading: mediaCounts.get('UPLOADING') ?? 0,
      }),
    })
  }

  async function listUsers(
    query: AdminListQuery,
  ): Promise<AdminPaginated<AdminUserRow>> {
    const users = required(database.user, 'User')
    const where = userWhere(query.query)
    const [total, rows] = await Promise.all([
      users.count({where}),
      users.findMany({
        orderBy: {created_at: 'desc'},
        select: {
          accounts: {select: {provider: true}},
          created_at: true,
          email: true,
          emailVerified: true,
          id: true,
          last_sign_in_at: true,
          name: true,
          role: true,
          updated_at: true,
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        where,
      }),
    ])

    return Object.freeze({
      items: Object.freeze(rows.map(mapUser)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    })
  }

  async function getOverview(): Promise<AdminOverview> {
    const [users, content, media, contact, email, audit, failedJobs] = await Promise.all([
      required(database.user, 'User').count(),
      getContentSummary(),
      getMediaSummary(),
      getContactSummary(),
      getEmailSummary(),
      listAuditEvents({entityType: '', page: 1, pageSize: 8, query: ''}),
      required(database.outboxJob, 'OutboxJob').count({where: {status: 'FAILED'}}),
    ])
    const totalContent = content.collections.reduce((sum, item) => sum + item.total, 0)
    const publishedContent = content.collections.reduce(
      (sum, item) => sum + item.published,
      0,
    )
    const draftContent = content.collections.reduce((sum, item) => sum + item.draft, 0)

    return Object.freeze({
      metrics: Object.freeze({
        activeSubscribers: email.subscribers.active,
        mediaReady: media.media.ready,
        openFeedback: contact.feedback.new + contact.feedback.inReview,
        publishedContent,
        totalContent,
        users,
      }),
      pipeline: Object.freeze({
        draftContent,
        failedJobs,
        pendingMedia: media.media.uploading,
        pendingSubscribers: email.subscribers.pending,
      }),
      recentAudit: audit.items,
    })
  }

  return Object.freeze({
    getContactSummary,
    getContentSummary,
    getEmailSummary,
    getMediaSummary,
    getOverview,
    getSystemSummary,
    listAuditEvents,
    listUsers,
  })
}
