import {z} from 'zod'

import type {
  AdminActor,
  AdminAuditQuery,
  AdminCapability,
  AdminListQuery,
  AdminRepository,
} from './admin-repository'

type Environment = Readonly<Record<string, string | undefined>>

type RawListQuery = Readonly<{
  entityType?: string | string[]
  page?: string | string[]
  query?: string | string[]
}>

export class AdminAuthorizationError extends Error {
  readonly statusCode = 403

  constructor() {
    super('Admin capability required')
    this.name = 'AdminAuthorizationError'
  }
}

export type AdminConfigurationStatus = Readonly<{
  configured: boolean
  description: string
  key: 'analytics' | 'database' | 'email' | 'googleAuth' | 'storage' | 'tagManager'
  label: string
}>

const rawQuerySchema = z
  .object({
    entityType: z.string().trim().max(120).default(''),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    query: z.string().trim().max(100).default(''),
  })
  .strict()

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseListQuery(input: RawListQuery): AdminAuditQuery {
  const parsed = rawQuerySchema.safeParse({
    entityType: first(input.entityType),
    page: first(input.page),
    query: first(input.query),
  })

  if (!parsed.success) {
    throw new Error('Invalid admin list query')
  }

  return Object.freeze({...parsed.data, pageSize: 25})
}

function configured(environment: Environment, keys: readonly string[]) {
  return keys.every(key => Boolean(environment[key]?.trim()))
}

function configurationStatus(environment: Environment): readonly AdminConfigurationStatus[] {
  return Object.freeze([
    Object.freeze({
      configured: configured(environment, ['DATABASE_URL']),
      description: 'PostgreSQL connection is available to the runtime.',
      key: 'database' as const,
      label: 'Database',
    }),
    Object.freeze({
      configured: configured(environment, [
        'MEDIA_S3_ACCESS_KEY_ID',
        'MEDIA_S3_BUCKET',
        'MEDIA_S3_ENDPOINT',
        'MEDIA_S3_REGION',
        'MEDIA_S3_SECRET_ACCESS_KEY',
      ]),
      description: 'Private Garage bucket and scoped credentials are configured.',
      key: 'storage' as const,
      label: 'Garage storage',
    }),
    Object.freeze({
      configured: configured(environment, ['RESEND_API_KEY', 'RESEND_FROM_EMAIL']),
      description: 'Transactional sender and Resend API access are configured.',
      key: 'email' as const,
      label: 'Resend email',
    }),
    Object.freeze({
      configured: configured(environment, ['AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET']),
      description: 'Google OAuth client credentials are configured.',
      key: 'googleAuth' as const,
      label: 'Google OAuth',
    }),
    Object.freeze({
      configured: configured(environment, ['NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID']),
      description: 'The production Tag Manager container is configured.',
      key: 'tagManager' as const,
      label: 'Google Tag Manager',
    }),
    Object.freeze({
      configured: Boolean(
        environment.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() ||
          environment.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?.trim(),
      ),
      description: 'GA4 is configured directly or through Tag Manager.',
      key: 'analytics' as const,
      label: 'Google Analytics',
    }),
  ])
}

export function createAdminService({
  environment,
  repository,
  requireCapability,
}: Readonly<{
  environment: Environment
  repository: AdminRepository
  requireCapability: (capability: AdminCapability) => Promise<AdminActor>
}>) {
  async function authorized<T>(
    capability: AdminCapability,
    read: () => Promise<T>,
  ) {
    await requireCapability(capability)

    return read()
  }

  return Object.freeze({
    getContactSummary: () =>
      authorized('VIEW_CONTACT', () => repository.getContactSummary()),
    getContentSummary: () =>
      authorized('VIEW_CONTENT', () => repository.getContentSummary()),
    getEmailSummary: () =>
      authorized('VIEW_EMAIL', () => repository.getEmailSummary()),
    getMediaSummary: () =>
      authorized('VIEW_MEDIA', () => repository.getMediaSummary()),
    getOverview: () =>
      authorized('VIEW_DASHBOARD', () => repository.getOverview()),
    async getSystemSummary() {
      return authorized('VIEW_SYSTEM', async () => ({
        ...(await repository.getSystemSummary()),
        configuration: configurationStatus(environment),
      }))
    },
    async listAuditEvents(input: RawListQuery) {
      const query = parseListQuery(input)

      return authorized('VIEW_AUDIT', () => repository.listAuditEvents(query))
    },
    async listUsers(input: RawListQuery) {
      const parsed = parseListQuery(input)
      const query: AdminListQuery = {
        page: parsed.page,
        pageSize: parsed.pageSize,
        query: parsed.query,
      }

      return authorized('VIEW_USERS', () => repository.listUsers(query))
    },
  })
}
