import {EditorialPreviewAccessError} from './publishing-errors'
import {toImmutableEditorialSnapshot} from './snapshot'

import type {
  EditorialAggregate,
  EditorialSnapshot,
  PreviewAuthorizationInput,
} from './contracts'

const previewRoles = new Set(['ADMIN', 'EDITOR', 'OWNER'])
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function canAccessEditorialPreview(
  authorization: PreviewAuthorizationInput,
  aggregate: EditorialAggregate,
  now: Date = new Date(),
): boolean {
  return (
    authorization.signatureVerified &&
    previewRoles.has(authorization.actorRole) &&
    uuidPattern.test(authorization.actorUserId) &&
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
  if (
    aggregate.status !== 'PUBLISHED' ||
    !aggregate.publishedSnapshot ||
    !aggregate.publishedAt ||
    aggregate.publishedAt.getTime() > now.getTime()
  ) {
    return null
  }

  return toImmutableEditorialSnapshot(aggregate.publishedSnapshot)
}

export function selectStudioPreviewSnapshot(
  aggregate: EditorialAggregate,
  authorization: PreviewAuthorizationInput,
  now: Date = new Date(),
): EditorialSnapshot {
  if (!canAccessEditorialPreview(authorization, aggregate, now)) {
    throw new EditorialPreviewAccessError()
  }

  return toImmutableEditorialSnapshot(aggregate.draftSnapshot)
}
