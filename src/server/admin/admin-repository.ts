export type AdminActor = Readonly<{
  email: string | null
  id: string
  name: string | null
  role: 'ADMIN'
}>

export type AdminAuditQuery = AdminListQuery &
  Readonly<{
    entityType: string
  }>

export type AdminAuditRow = Readonly<{
  action: string
  actor: Readonly<{email: string | null; name: string | null}> | null
  actorUserId: string | null
  createdAt: Date
  entityId: string | null
  entityType: string
  id: string
  requestId: string | null
}>

export type AdminCapability =
  | 'VIEW_AUDIT'
  | 'VIEW_CONTACT'
  | 'VIEW_CONTENT'
  | 'VIEW_DASHBOARD'
  | 'VIEW_EMAIL'
  | 'VIEW_MEDIA'
  | 'VIEW_SYSTEM'
  | 'VIEW_USERS'

export type AdminContactLocale = Readonly<{
  address: string
  email: string
  isPrimary: boolean
  locale: string
  phone: string
  updatedAt: Date
  workingHours: string | null
}>

export type AdminContactSummary = Readonly<{
  contactLocales: readonly AdminContactLocale[]
  feedback: Readonly<{
    inReview: number
    new: number
    resolved: number
    total: number
  }>
  recentFeedback: readonly AdminFeedbackRow[]
}>

export type AdminContentCollection = Readonly<{
  archived: number
  draft: number
  key:
    | 'artistStats'
    | 'artworks'
    | 'memories'
    | 'newsArticles'
    | 'pressItems'
    | 'testimonials'
    | 'workshopItems'
  label: string
  published: number
  total: number
}>

export type AdminContentSummary = Readonly<{
  collections: readonly AdminContentCollection[]
}>

export type AdminEmailSummary = Readonly<{
  delivery: Readonly<{
    completed: number
    failed: number
    pending: number
  }>
  recentSubscribers: readonly AdminSubscriberRow[]
  subscribers: Readonly<{
    active: number
    bounced: number
    pending: number
    total: number
    unsubscribed: number
  }>
}>

export type AdminFeedbackRow = Readonly<{
  createdAt: Date
  email: string
  id: string
  name: string
  status: 'IN_REVIEW' | 'NEW' | 'RESOLVED' | 'SPAM'
  subject: string
}>

export type AdminListQuery = Readonly<{
  page: number
  pageSize: number
  query: string
}>

export type AdminMediaRow = Readonly<{
  createdAt: Date
  filename: string
  id: string
  mimeType: string
  provider: string
  sizeBytes: number
  status: 'FAILED' | 'QUARANTINED' | 'READY' | 'UPLOADING'
  visibility: 'PRIVATE' | 'PUBLIC'
}>

export type AdminMediaSummary = Readonly<{
  instagram: Readonly<{
    active: number
    lastSyncedAt: Date | null
    total: number
  }>
  media: Readonly<{
    bytes: number
    failed: number
    ready: number
    total: number
    uploading: number
  }>
  recentMedia: readonly AdminMediaRow[]
}>

export type AdminPaginated<T> = Readonly<{
  items: readonly T[]
  page: number
  pageSize: number
  total: number
}>

export type AdminOverview = Readonly<{
  metrics: Readonly<{
    activeSubscribers: number
    mediaReady: number
    openFeedback: number
    publishedContent: number
    totalContent: number
    users: number
  }>
  pipeline: Readonly<{
    draftContent: number
    failedJobs: number
    pendingMedia: number
    pendingSubscribers: number
  }>
  recentAudit: readonly AdminAuditRow[]
}>

export type AdminUserRow = Readonly<{
  createdAt: Date
  email: string | null
  emailVerified: boolean
  id: string
  lastSignInAt: Date | null
  name: string | null
  providers: readonly string[]
  role: 'ADMIN' | 'ARTIST' | 'USER'
  updatedAt: Date
}>

export interface AdminRepository {
  getContactSummary(): Promise<AdminContactSummary>
  getContentSummary(): Promise<AdminContentSummary>
  getEmailSummary(): Promise<AdminEmailSummary>
  getMediaSummary(): Promise<AdminMediaSummary>
  getOverview(): Promise<AdminOverview>
  getSystemSummary(): Promise<AdminSystemData>
  listAuditEvents(query: AdminAuditQuery): Promise<AdminPaginated<AdminAuditRow>>
  listUsers(query: AdminListQuery): Promise<AdminPaginated<AdminUserRow>>
}

export type AdminSubscriberRow = Readonly<{
  confirmedAt: Date | null
  createdAt: Date
  email: string
  id: string
  locale: string
  source: string
  status: 'ACTIVE' | 'BOUNCED' | 'PENDING' | 'UNSUBSCRIBED'
}>

export type AdminSystemData = Readonly<{
  auditEventsLast24Hours: number
  jobs: Readonly<{
    completed: number
    failed: number
    pending: number
    processing: number
  }>
  latestAuditAt: Date | null
  rateLimitBuckets: number
  storage: Readonly<{
    failed: number
    ready: number
    uploading: number
  }>
}>
