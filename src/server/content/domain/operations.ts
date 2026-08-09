import {z} from 'zod'

import {
  optionalText,
  requiredText,
  rowMetadataShape,
  uuidSchema,
} from './common'

const jsonObjectSchema = z.record(z.string(), z.unknown())

export type AuditEvent = z.infer<typeof auditEventRowSchema>

export type AuditEventCreate = z.infer<typeof auditEventCreateSchema>

export type MediaObject = z.infer<typeof mediaObjectRowSchema>

export const auditEventCreateSchema = z
  .object({
    action: requiredText(1, 120),
    actorUserId: uuidSchema.nullable().optional(),
    entityId: optionalText(160),
    entityType: requiredText(1, 120),
    ipHash: z.string().max(128).nullable().optional(),
    metadata: jsonObjectSchema.default({}),
    requestId: z.string().max(160).nullable().optional(),
    userAgent: z.string().max(1000).nullable().optional(),
  })
  .strict()

export type MediaObjectCreate = z.infer<typeof mediaObjectCreateSchema>

export const auditEventRowSchema = z.object({
  action: z.string(),
  actorUserId: uuidSchema.nullable(),
  createdAt: z.date(),
  entityId: z.string().nullable(),
  entityType: z.string(),
  id: uuidSchema,
  ipHash: z.string().nullable(),
  metadata: jsonObjectSchema,
  requestId: z.string().nullable(),
  userAgent: z.string().nullable(),
})

export type OutboxJob = z.infer<typeof outboxJobRowSchema>

export const mediaObjectCreateSchema = z
  .object({
    checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
    filename: requiredText(1, 255),
    height: z.number().int().positive().nullable().optional(),
    mimeType: requiredText(3, 127),
    objectKey: requiredText(1, 1024),
    originalFilename: requiredText(1, 255),
    provider: z.literal('garage').default('garage'),
    sizeBytes: z.number().int().nonnegative(),
    uploadedByUserId: uuidSchema.nullable().optional(),
    visibility: z.enum(['PRIVATE', 'PUBLIC']).default('PRIVATE'),
    width: z.number().int().positive().nullable().optional(),
  })
  .strict()

export type OutboxJobCreate = z.infer<typeof outboxJobCreateSchema>
export const mediaObjectRowSchema = z.object({
  ...rowMetadataShape,
  checksumSha256: z.string(),
  filename: z.string(),
  height: z.number().int().nullable(),
  mimeType: z.string(),
  objectKey: z.string(),
  originalFilename: z.string(),
  provider: z.literal('garage'),
  sizeBytes: z.number().int(),
  status: z.enum(['UPLOADING', 'READY', 'FAILED', 'QUARANTINED']),
  uploadedByUserId: uuidSchema.nullable(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']),
  width: z.number().int().nullable(),
})
export type RateLimitBucket = z.infer<typeof rateLimitBucketRowSchema>
export const outboxJobCreateSchema = z
  .object({
    availableAt: z.date().default(() => new Date()),
    idempotencyKey: requiredText(1, 200),
    maxAttempts: z.number().int().min(1).max(100).default(10),
    payload: jsonObjectSchema,
    type: requiredText(1, 120),
  })
  .strict()
export type RateLimitBucketInput = z.infer<typeof rateLimitBucketInputSchema>
export const outboxJobRowSchema = z.object({
  attempts: z.number().int().nonnegative(),
  availableAt: z.date(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  id: uuidSchema,
  idempotencyKey: z.string(),
  lastError: z.string().nullable(),
  lockedAt: z.date().nullable(),
  lockedBy: z.string().nullable(),
  maxAttempts: z.number().int().positive(),
  payload: jsonObjectSchema,
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  type: z.string(),
  updatedAt: z.date(),
})
export const rateLimitBucketInputSchema = z
  .object({
    action: requiredText(1, 120),
    attempts: z.number().int().min(1),
    key: z.string().regex(/^[a-f0-9]{64}$/),
    windowStart: z.date(),
  })
  .strict()
export const rateLimitBucketRowSchema = z.object({
  action: z.string(),
  attempts: z.number().int().nonnegative(),
  createdAt: z.date(),
  key: z.string(),
  updatedAt: z.date(),
  windowStart: z.date(),
})
