import {isVerifiedEditorialPreviewAuthorization} from './preview-token'
import {EditorialPreviewAccessError} from './publishing-errors'
import {toImmutableEditorialSnapshot} from './snapshot'

import type {EditorialAggregate, EditorialSnapshot} from './contracts'
import type {VerifiedEditorialPreviewAuthorization} from './preview-token'

export function canAccessEditorialPreview(
  authorization: VerifiedEditorialPreviewAuthorization,
  aggregate: EditorialAggregate,
  now: Date = new Date(),
): boolean {
  return (
    isVerifiedEditorialPreviewAuthorization(authorization) &&
    authorization.entityId === aggregate.entityId &&
    authorization.entityType === aggregate.entityType &&
    Number.isFinite(authorization.expiresAt.getTime()) &&
    authorization.expiresAt.getTime() > now.getTime()
  )
}

export function selectPublicSnapshot(
  aggregate: EditorialAggregate,
  now: Date = new Date(),
): EditorialSnapshot | null {
  const publishedAt = aggregate.publishedAt?.getTime()
  const selectedAt = now.getTime()

  if (
    aggregate.status !== 'PUBLISHED' ||
    !aggregate.publishedSnapshot ||
    publishedAt === undefined ||
    !Number.isFinite(publishedAt) ||
    !Number.isFinite(selectedAt) ||
    publishedAt > selectedAt
  ) {
    return null
  }

  return toImmutableEditorialSnapshot(aggregate.publishedSnapshot)
}

export function selectStudioPreviewSnapshot(
  aggregate: EditorialAggregate,
  authorization: VerifiedEditorialPreviewAuthorization,
  now: Date = new Date(),
): EditorialSnapshot {
  if (!canAccessEditorialPreview(authorization, aggregate, now)) {
    throw new EditorialPreviewAccessError()
  }

  return toImmutableEditorialSnapshot(aggregate.draftSnapshot)
}
