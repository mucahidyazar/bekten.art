import {readFileSync} from 'node:fs'

import {describe, expect, it} from 'vitest'

const schema = readFileSync(new URL('./schema.prisma', import.meta.url), 'utf8')
const migration = readFileSync(
  new URL(
    './migrations/20260810120000_add_v2_editorial_domain/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

function model(name: string) {
  const match = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`))

  expect(match, `model ${name} must exist`).not.toBeNull()
  return match?.[1] ?? ''
}

function enumBlock(name: string) {
  const match = schema.match(new RegExp(`enum ${name} \\{([\\s\\S]*?)\\n\\}`))

  expect(match, `enum ${name} must exist`).not.toBeNull()
  return match?.[1] ?? ''
}

describe('V2 editorial Prisma contract', () => {
  it('adds Studio roles without removing legacy role labels', () => {
    expect(enumBlock('UserRole')).toMatch(/\bUSER\b/)
    expect(enumBlock('UserRole')).toMatch(/\bARTIST\b/)
    expect(enumBlock('UserRole')).toMatch(/\bADMIN\b/)
    expect(enumBlock('UserRole')).toMatch(/\bEDITOR\b/)
    expect(enumBlock('UserRole')).toMatch(/\bOWNER\b/)
  })

  it.each([
    ['Collection', 'collections'],
    ['Exhibition', 'exhibitions'],
    ['JournalEntry', 'journal_entries'],
    ['Page', 'pages'],
  ])('%s carries localized editorial lifecycle metadata', (name, tableName) => {
    const block = model(name)

    expect(block).toMatch(/locale\s+String\s+@db\.VarChar\(5\)/)
    expect(block).toMatch(/slug\s+String\s+@db\.VarChar\(160\)/)
    expect(block).toMatch(/displayOrder\s+Int\s+@default\(0\)\s+@map\("display_order"\)/)
    expect(block).toMatch(/version\s+Int\s+@default\(0\)/)
    expect(block).toMatch(/status\s+ContentStatus\s+@default\(DRAFT\)/)
    expect(block).toMatch(/publishedAt\s+DateTime\?\s+@map\("published_at"\)/)
    expect(block).toMatch(/seoTitle\s+String\?\s+@map\("seo_title"\)/)
    expect(block).toMatch(/seoDescription\s+String\?\s+@map\("seo_description"\)/)
    expect(block).toMatch(/@@unique\(\[locale, slug\]\)/)
    expect(block).toContain(`@@map("${tableName}")`)
  })

  it('extends artworks and press items additively for V2 editorial reads', () => {
    const artwork = model('Artwork')
    const pressItem = model('PressItem')

    expect(artwork).toMatch(/collectionId\s+String\?\s+@map\("collection_id"\)\s+@db\.Uuid/)
    expect(enumBlock('AvailabilityStatus')).toMatch(/AVAILABLE[\s\S]*ON_REQUEST/)
    expect(artwork).toMatch(/availabilityStatus\s+AvailabilityStatus\s+@default\(AVAILABLE\)/)
    expect(artwork).toMatch(/seoTitle\s+String\?\s+@map\("seo_title"\)/)
    expect(artwork).toMatch(/seoDescription\s+String\?\s+@map\("seo_description"\)/)
    expect(artwork).toMatch(/version\s+Int\s+@default\(0\)/)
    expect(artwork).toMatch(/collection\s+Collection\?\s+@relation/)
    expect(artwork).toMatch(/priceMinor\s+Int\?/)
    expect(artwork).toMatch(/currency\s+String\?/)

    expect(pressItem).toMatch(/slug\s+String\s+@db\.VarChar\(160\)/)
    expect(pressItem).toMatch(/seoTitle\s+String\?\s+@map\("seo_title"\)/)
    expect(pressItem).toMatch(/seoDescription\s+String\?\s+@map\("seo_description"\)/)
    expect(pressItem).toMatch(/version\s+Int\s+@default\(0\)/)
    expect(pressItem).toMatch(/@@unique\(\[locale, slug\]\)/)
  })

  it('models exhibition membership and ordered Garage media placements', () => {
    const exhibitionArtwork = model('ExhibitionArtwork')
    const placement = model('ContentMediaPlacement')
    const mediaObject = model('MediaObject')

    expect(exhibitionArtwork).toMatch(/exhibitionId\s+String\s+@map\("exhibition_id"\)\s+@db\.Uuid/)
    expect(exhibitionArtwork).toMatch(/artworkId\s+String\s+@map\("artwork_id"\)\s+@db\.Uuid/)
    expect(exhibitionArtwork).toMatch(/@@id\(\[exhibitionId, artworkId\]\)/)

    expect(placement).toMatch(/entityType\s+ContentEntityType\s+@map\("entity_type"\)/)
    expect(placement).toMatch(/entityId\s+String\s+@map\("entity_id"\)\s+@db\.Uuid/)
    expect(placement).toMatch(/mediaObjectId\s+String\s+@map\("media_object_id"\)\s+@db\.Uuid/)
    expect(placement).toMatch(/role\s+MediaPlacementRole/)
    expect(placement).toMatch(/altText\s+String\s+@map\("alt_text"\)/)
    expect(placement).toMatch(/displayOrder\s+Int\s+@default\(0\)\s+@map\("display_order"\)/)
    expect(placement).toMatch(/mediaObject\s+MediaObject\s+@relation/)
    expect(mediaObject).toMatch(/contentPlacements\s+ContentMediaPlacement\[\]/)
  })

  it('defines immutable versioned revision lineage', () => {
    const revision = model('ContentRevision')

    expect(enumBlock('ContentRevisionOperation')).toMatch(/\bPUBLISH\b/)
    expect(enumBlock('ContentRevisionOperation')).toMatch(/\bRESTORE\b/)
    expect(revision).toMatch(/entityType\s+ContentEntityType\s+@map\("entity_type"\)/)
    expect(revision).toMatch(/entityId\s+String\s+@map\("entity_id"\)\s+@db\.Uuid/)
    expect(revision).toMatch(/locale\s+String\s+@db\.VarChar\(5\)/)
    expect(revision).toMatch(/version\s+Int/)
    expect(revision).toMatch(/operation\s+ContentRevisionOperation/)
    expect(revision).toMatch(/snapshot\s+Json/)
    expect(revision).toMatch(/sourceRevisionId\s+String\?\s+@map\("source_revision_id"\)\s+@db\.Uuid/)
    expect(revision).toMatch(/actorUserId\s+String\?\s+@map\("actor_user_id"\)\s+@db\.Uuid/)
    expect(revision).toMatch(/@@unique\(\[entityType, entityId, version\]\)/)
  })

  it('persists typed, idempotent and retention-aware premium inquiries', () => {
    const inquiry = model('Inquiry')

    expect(enumBlock('InquiryType')).toMatch(/AVAILABILITY[\s\S]*COMMISSION[\s\S]*PRIVATE_VIEWING[\s\S]*GENERAL/)
    expect(enumBlock('InquiryStatus')).toMatch(/NEW[\s\S]*IN_REVIEW[\s\S]*RESPONDED[\s\S]*CLOSED[\s\S]*ARCHIVED/)
    expect(inquiry).toMatch(/submissionId\s+String\s+@unique\s+@map\("submission_id"\)\s+@db\.Uuid/)
    expect(inquiry).toMatch(/source\s+String\s+@db\.VarChar\(80\)/)
    expect(inquiry).toMatch(/abuseKeyHash\s+String\s+@map\("abuse_key_hash"\)\s+@db\.Char\(64\)/)
    expect(inquiry).toMatch(/consentedAt\s+DateTime\s+@map\("consented_at"\)/)
    expect(inquiry).toMatch(/privacyNoticeVersion\s+String\s+@map\("privacy_notice_version"\)/)
    expect(inquiry).toMatch(/relatedArtworkId\s+String\?\s+@map\("related_artwork_id"\)\s+@db\.Uuid/)
    expect(inquiry).toMatch(/relatedArtworkTitle\s+String\?\s+@map\("related_artwork_title"\)/)
    expect(inquiry).toMatch(/relatedArtworkSlug\s+String\?\s+@map\("related_artwork_slug"\)/)
    expect(inquiry).toMatch(/relatedArtworkYear\s+Int\?\s+@map\("related_artwork_year"\)/)
    expect(inquiry).toMatch(/relatedArtworkLocale\s+String\?\s+@map\("related_artwork_locale"\)/)
    expect(inquiry).toMatch(/brief\s+String\?\s+@db\.Text/)
    expect(inquiry).toMatch(/preferredTimeline\s+String\?\s+@map\("preferred_timeline"\)/)
    expect(inquiry).toMatch(/preferredDates\s+DateTime\[\]\s+@default\(\[\]\)/)
    expect(inquiry).toMatch(/attendees\s+Int\?/)
    expect(inquiry).toMatch(/subject\s+String\?/)
    expect(inquiry).toMatch(/labels\s+String\[\]\s+@default\(\[\]\)/)
    expect(inquiry).toMatch(/purgeAfter\s+DateTime\?\s+@map\("erase_personal_data_after"\)/)

    const internalNote = model('InquiryInternalNote')
    expect(internalNote).toMatch(/inquiryId\s+String\s+@map\("inquiry_id"\)\s+@db\.Uuid/)
    expect(internalNote).toMatch(/body\s+String\s+@db\.Text/)
    expect(internalNote).toMatch(/authorUserId\s+String\?\s+@map\("author_user_id"\)\s+@db\.Uuid/)
  })

  it('ships an additive migration with data-safe compatibility work', () => {
    expect(migration).not.toMatch(/\bDROP\s+(?:TABLE|COLUMN|TYPE)\b/i)
    expect(migration).toContain('ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS \'EDITOR\'')
    expect(migration).toContain('ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS \'OWNER\'')
    expect(migration).toMatch(/BEGIN;[\s\S]*UPDATE "users"[\s\S]*'ADMIN'[\s\S]*'OWNER'[\s\S]*COMMIT;/)
    expect(migration).toMatch(/ADD COLUMN\s+"slug"[\s\S]*UPDATE "press_items"[\s\S]*SET NOT NULL/)
    expect(migration).toContain('CREATE TABLE "collections"')
    expect(migration).toContain('CREATE TABLE "exhibitions"')
    expect(migration).toContain('CREATE TABLE "journal_entries"')
    expect(migration).toContain('CREATE TABLE "pages"')
    expect(migration).toContain('CREATE TABLE "inquiries"')
    expect(migration).toContain('CREATE TABLE "content_revisions"')
    expect(migration).toContain('CREATE TABLE "content_media_placements"')
    expect(migration).toContain('Rollback strategy')
  })
})
