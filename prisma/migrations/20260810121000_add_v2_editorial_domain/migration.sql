-- Rollback strategy: revert application reads to the legacy tables and leave
-- these additive enums, columns, tables and indexes unused. Before rolling an
-- old application build back, transactionally map OWNER rows back to ADMIN.
-- Do not physically remove this migration's objects during an incident.

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'ON_REQUEST', 'RESERVED', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "EditorialEntityType" AS ENUM ('ARTWORK', 'COLLECTION', 'EXHIBITION', 'JOURNAL_ENTRY', 'PAGE', 'PRESS_ENTRY');

-- CreateEnum
CREATE TYPE "ContentRevisionOperation" AS ENUM ('PUBLISH', 'RESTORE');

-- CreateEnum
CREATE TYPE "MediaPlacementRole" AS ENUM ('HERO', 'THUMBNAIL', 'GALLERY', 'INLINE', 'SEO');

-- CreateEnum
CREATE TYPE "MediaPlacementCrop" AS ENUM ('ORIGINAL', 'LANDSCAPE', 'PORTRAIT', 'SQUARE');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('AVAILABILITY', 'COMMISSION', 'PRIVATE_VIEWING', 'GENERAL');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESPONDED', 'CLOSED', 'ARCHIVED');

-- Only email-verified ADMIN rows are verified V1 operators. Migrate that
-- eligible set atomically and retain unverified ADMIN rows for compatibility.
BEGIN;
DO $$
DECLARE
    eligible_admin_count_before INTEGER;
    owner_count_before INTEGER;
    eligible_admin_count_after INTEGER;
    owner_count_after INTEGER;
BEGIN
    SELECT COUNT(*) INTO eligible_admin_count_before
    FROM "users"
    WHERE "role" = 'ADMIN' AND "email_verified" IS NOT NULL;

    SELECT COUNT(*) INTO owner_count_before FROM "users" WHERE "role" = 'OWNER';

    UPDATE "users"
    SET "role" = 'OWNER'
    WHERE "role" = 'ADMIN' AND "email_verified" IS NOT NULL;

    SELECT COUNT(*) INTO eligible_admin_count_after
    FROM "users"
    WHERE "role" = 'ADMIN' AND "email_verified" IS NOT NULL;

    SELECT COUNT(*) INTO owner_count_after FROM "users" WHERE "role" = 'OWNER';

    RAISE NOTICE 'UserRole verified ADMIN->OWNER audit: eligible before %, eligible after %, owner before %, owner after %',
      eligible_admin_count_before, eligible_admin_count_after, owner_count_before, owner_count_after;

    IF eligible_admin_count_after <> 0 OR owner_count_after <> owner_count_before + eligible_admin_count_before THEN
        RAISE EXCEPTION 'UserRole verified ADMIN->OWNER verification failed';
    END IF;
END $$;
COMMIT;

-- AlterTable
ALTER TABLE "artworks" ADD COLUMN     "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'ON_REQUEST',
ADD COLUMN     "collection_id" UUID,
ADD COLUMN     "seo_canonical_path" VARCHAR(2048),
ADD COLUMN     "seo_description" VARCHAR(170),
ADD COLUMN     "seo_no_index" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seo_title" VARCHAR(70),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "artworks"
SET
    "availability_status" = CASE
        WHEN "is_available" THEN 'AVAILABLE'::"AvailabilityStatus"
        ELSE 'NOT_AVAILABLE'::"AvailabilityStatus"
    END,
    "seo_title" = LEFT("title", 70),
    "seo_description" = LEFT("description", 170),
    "seo_canonical_path" = '/' || "locale" || '/works/' || "slug";

-- AlterTable
ALTER TABLE "press_items" ADD COLUMN     "seo_canonical_path" VARCHAR(2048),
ADD COLUMN     "seo_description" VARCHAR(170),
ADD COLUMN     "seo_no_index" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seo_title" VARCHAR(70),
ADD COLUMN     "slug" VARCHAR(160),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "press_items"
SET "slug" =
    COALESCE(
        NULLIF(
            LEFT(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("title"), '[^a-z0-9]+', '-', 'g')), 140),
            ''
        ),
        'press'
    ) || '-' || LEFT(REPLACE("id"::TEXT, '-', ''), 12);

UPDATE "press_items"
SET
    "seo_title" = LEFT("title", 70),
    "seo_description" = LEFT("description", 170),
    "seo_canonical_path" = '/' || "locale" || '/press/' || "slug";

ALTER TABLE "press_items" ALTER COLUMN "slug" SET NOT NULL;

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "seo_title" VARCHAR(70) NOT NULL,
    "seo_description" VARCHAR(170) NOT NULL,
    "seo_canonical_path" VARCHAR(2048) NOT NULL,
    "seo_no_index" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibitions" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subtitle" VARCHAR(300),
    "body" TEXT NOT NULL,
    "venue" VARCHAR(240),
    "city" VARCHAR(160),
    "country" VARCHAR(160),
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "seo_title" VARCHAR(70) NOT NULL,
    "seo_description" VARCHAR(170) NOT NULL,
    "seo_canonical_path" VARCHAR(2048) NOT NULL,
    "seo_no_index" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exhibitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibition_artworks" (
    "exhibition_id" UUID NOT NULL,
    "artwork_id" UUID NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exhibition_artworks_pkey" PRIMARY KEY ("exhibition_id","artwork_id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "seo_title" VARCHAR(70) NOT NULL,
    "seo_description" VARCHAR(170) NOT NULL,
    "seo_canonical_path" VARCHAR(2048) NOT NULL,
    "seo_no_index" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "eyebrow" VARCHAR(120),
    "body" TEXT NOT NULL,
    "seo_title" VARCHAR(70) NOT NULL,
    "seo_description" VARCHAR(170) NOT NULL,
    "seo_canonical_path" VARCHAR(2048) NOT NULL,
    "seo_no_index" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_media_placements" (
    "id" UUID NOT NULL,
    "entity_type" "EditorialEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "media_object_id" UUID NOT NULL,
    "role" "MediaPlacementRole" NOT NULL,
    "crop" "MediaPlacementCrop" NOT NULL DEFAULT 'ORIGINAL',
    "alt_text" VARCHAR(300) NOT NULL,
    "caption" VARCHAR(1000),
    "credit" VARCHAR(300),
    "focal_point" JSONB,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_media_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revisions" (
    "id" UUID NOT NULL,
    "entity_type" "EditorialEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "version" INTEGER NOT NULL,
    "operation" "ContentRevisionOperation" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "source_revision_id" UUID,
    "actor_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "type" "InquiryType" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "locale" VARCHAR(5) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(40),
    "source" VARCHAR(80) NOT NULL,
    "abuse_key_hash" CHAR(64) NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "privacy_notice_version" VARCHAR(40) NOT NULL,
    "subject" VARCHAR(200),
    "message" TEXT,
    "brief" TEXT,
    "preferred_timeline" VARCHAR(300),
    "preferred_dates" DATE[] DEFAULT ARRAY[]::DATE[],
    "attendees" INTEGER,
    "related_artwork_id" UUID,
    "related_artwork_title" VARCHAR(200),
    "related_artwork_slug" VARCHAR(160),
    "related_artwork_year" INTEGER,
    "related_artwork_locale" VARCHAR(5),
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "erase_personal_data_after" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_internal_notes" (
    "id" UUID NOT NULL,
    "inquiry_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "author_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_internal_notes_pkey" PRIMARY KEY ("id")
);

-- Database invariants mirror the locale, ordering, publication, chronology,
-- accessibility, optimistic-version and type-specific Zod boundaries.
ALTER TABLE "artworks"
    ADD CONSTRAINT "artworks_v2_version_check" CHECK ("version" >= 1);

ALTER TABLE "press_items"
    ADD CONSTRAINT "press_items_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "press_items_version_check" CHECK ("version" >= 1);

ALTER TABLE "collections"
    ADD CONSTRAINT "collections_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    ADD CONSTRAINT "collections_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "collections_display_order_check" CHECK ("display_order" >= 0),
    ADD CONSTRAINT "collections_version_check" CHECK ("version" >= 1),
    ADD CONSTRAINT "collections_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);

ALTER TABLE "exhibitions"
    ADD CONSTRAINT "exhibitions_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    ADD CONSTRAINT "exhibitions_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "exhibitions_display_order_check" CHECK ("display_order" >= 0),
    ADD CONSTRAINT "exhibitions_version_check" CHECK ("version" >= 1),
    ADD CONSTRAINT "exhibitions_dates_check" CHECK ("ends_at" IS NULL OR "ends_at" >= "starts_at"),
    ADD CONSTRAINT "exhibitions_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);

ALTER TABLE "exhibition_artworks"
    ADD CONSTRAINT "exhibition_artworks_display_order_check" CHECK ("display_order" >= 0);

ALTER TABLE "journal_entries"
    ADD CONSTRAINT "journal_entries_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    ADD CONSTRAINT "journal_entries_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "journal_entries_display_order_check" CHECK ("display_order" >= 0),
    ADD CONSTRAINT "journal_entries_version_check" CHECK ("version" >= 1),
    ADD CONSTRAINT "journal_entries_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);

ALTER TABLE "pages"
    ADD CONSTRAINT "pages_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    ADD CONSTRAINT "pages_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "pages_display_order_check" CHECK ("display_order" >= 0),
    ADD CONSTRAINT "pages_version_check" CHECK ("version" >= 1),
    ADD CONSTRAINT "pages_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);

ALTER TABLE "content_media_placements"
    ADD CONSTRAINT "content_media_placements_alt_text_check" CHECK (LENGTH(BTRIM("alt_text")) >= 5),
    ADD CONSTRAINT "content_media_placements_display_order_check" CHECK ("display_order" >= 0),
    ADD CONSTRAINT "content_media_placements_focal_point_check" CHECK ("focal_point" IS NULL OR JSONB_TYPEOF("focal_point") = 'object');

ALTER TABLE "content_revisions"
    ADD CONSTRAINT "content_revisions_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    ADD CONSTRAINT "content_revisions_version_check" CHECK ("version" >= 1),
    ADD CONSTRAINT "content_revisions_restore_source_check" CHECK ("operation" <> 'RESTORE' OR "source_revision_id" IS NOT NULL);

ALTER TABLE "inquiries"
    ALTER COLUMN "preferred_dates" SET NOT NULL,
    ALTER COLUMN "labels" SET NOT NULL,
    ADD CONSTRAINT "inquiries_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    ADD CONSTRAINT "inquiries_abuse_key_hash_check" CHECK ("abuse_key_hash" ~ '^[0-9a-f]{64}$'),
    ADD CONSTRAINT "inquiries_attendees_check" CHECK ("attendees" IS NULL OR "attendees" BETWEEN 1 AND 50),
    ADD CONSTRAINT "inquiries_preferred_dates_check" CHECK (CARDINALITY("preferred_dates") <= 3),
    ADD CONSTRAINT "inquiries_related_artwork_year_check" CHECK ("related_artwork_year" IS NULL OR "related_artwork_year" BETWEEN 1000 AND 3000),
    ADD CONSTRAINT "inquiries_related_artwork_snapshot_check" CHECK (
        ("related_artwork_title" IS NULL AND "related_artwork_slug" IS NULL AND "related_artwork_year" IS NULL AND "related_artwork_locale" IS NULL)
        OR
        ("related_artwork_title" IS NOT NULL AND "related_artwork_slug" IS NOT NULL AND COALESCE("related_artwork_locale" IN ('en', 'tr', 'ru', 'ky'), false))
    ),
    ADD CONSTRAINT "inquiries_type_details_check" CHECK (
        ("type" = 'AVAILABILITY' AND "related_artwork_title" IS NOT NULL)
        OR ("type" = 'COMMISSION' AND COALESCE(LENGTH(BTRIM("brief")) > 0, false))
        OR ("type" = 'PRIVATE_VIEWING' AND CARDINALITY("preferred_dates") BETWEEN 1 AND 3)
        OR ("type" = 'GENERAL' AND COALESCE(LENGTH(BTRIM("subject")) > 0, false) AND COALESCE(LENGTH(BTRIM("message")) > 0, false))
    ),
    ADD CONSTRAINT "inquiries_labels_check" CHECK (CARDINALITY("labels") <= 20),
    ADD CONSTRAINT "inquiries_retention_check" CHECK ("erase_personal_data_after" IS NULL OR "erase_personal_data_after" > "created_at");

ALTER TABLE "inquiry_internal_notes"
    ADD CONSTRAINT "inquiry_internal_notes_body_check" CHECK (LENGTH(BTRIM("body")) > 0);

-- Revision rows are an immutable ledger. Restores create a new revision instead
-- of mutating history. Internal notes can be deleted only through inquiry PII
-- retention, but an existing note can never be rewritten.
CREATE FUNCTION "prevent_content_revision_mutation"() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'content revisions are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "content_revisions_immutable"
BEFORE UPDATE OR DELETE ON "content_revisions"
FOR EACH ROW EXECUTE FUNCTION "prevent_content_revision_mutation"();

CREATE FUNCTION "prevent_inquiry_note_update"() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'inquiry internal notes are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "inquiry_internal_notes_append_only"
BEFORE UPDATE ON "inquiry_internal_notes"
FOR EACH ROW EXECUTE FUNCTION "prevent_inquiry_note_update"();

-- CreateIndex
CREATE INDEX "collections_locale_status_display_order_idx" ON "collections"("locale", "status", "display_order");

-- CreateIndex
CREATE INDEX "collections_status_published_at_idx" ON "collections"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "collections_locale_slug_key" ON "collections"("locale", "slug");

-- CreateIndex
CREATE INDEX "exhibitions_locale_status_display_order_idx" ON "exhibitions"("locale", "status", "display_order");

-- CreateIndex
CREATE INDEX "exhibitions_status_published_at_idx" ON "exhibitions"("status", "published_at");

-- CreateIndex
CREATE INDEX "exhibitions_starts_at_ends_at_idx" ON "exhibitions"("starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "exhibitions_locale_slug_key" ON "exhibitions"("locale", "slug");

-- CreateIndex
CREATE INDEX "exhibition_artworks_exhibition_id_display_order_idx" ON "exhibition_artworks"("exhibition_id", "display_order");

-- CreateIndex
CREATE INDEX "exhibition_artworks_artwork_id_idx" ON "exhibition_artworks"("artwork_id");

-- CreateIndex
CREATE INDEX "journal_entries_locale_status_display_order_idx" ON "journal_entries"("locale", "status", "display_order");

-- CreateIndex
CREATE INDEX "journal_entries_status_published_at_idx" ON "journal_entries"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_locale_slug_key" ON "journal_entries"("locale", "slug");

-- CreateIndex
CREATE INDEX "pages_locale_status_display_order_idx" ON "pages"("locale", "status", "display_order");

-- CreateIndex
CREATE INDEX "pages_status_published_at_idx" ON "pages"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "pages_locale_slug_key" ON "pages"("locale", "slug");

-- CreateIndex
CREATE INDEX "content_media_placements_entity_type_entity_id_role_idx" ON "content_media_placements"("entity_type", "entity_id", "role");

-- CreateIndex
CREATE INDEX "content_media_placements_media_object_id_idx" ON "content_media_placements"("media_object_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_media_placements_entity_type_entity_id_display_orde_key" ON "content_media_placements"("entity_type", "entity_id", "display_order");

-- CreateIndex
CREATE INDEX "content_revisions_entity_type_entity_id_created_at_idx" ON "content_revisions"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "content_revisions_source_revision_id_idx" ON "content_revisions"("source_revision_id");

-- CreateIndex
CREATE INDEX "content_revisions_actor_user_id_created_at_idx" ON "content_revisions"("actor_user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "content_revisions_entity_type_entity_id_version_key" ON "content_revisions"("entity_type", "entity_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_submission_id_key" ON "inquiries"("submission_id");

-- CreateIndex
CREATE INDEX "inquiries_status_created_at_idx" ON "inquiries"("status", "created_at");

-- CreateIndex
CREATE INDEX "inquiries_type_status_created_at_idx" ON "inquiries"("type", "status", "created_at");

-- CreateIndex
CREATE INDEX "inquiries_email_created_at_idx" ON "inquiries"("email", "created_at");

-- CreateIndex
CREATE INDEX "inquiries_abuse_key_hash_created_at_idx" ON "inquiries"("abuse_key_hash", "created_at");

-- CreateIndex
CREATE INDEX "inquiries_related_artwork_id_created_at_idx" ON "inquiries"("related_artwork_id", "created_at");

-- CreateIndex
CREATE INDEX "inquiries_labels_idx" ON "inquiries" USING GIN ("labels");

-- CreateIndex
CREATE INDEX "inquiries_erase_personal_data_after_idx" ON "inquiries"("erase_personal_data_after");

-- CreateIndex
CREATE INDEX "inquiry_internal_notes_inquiry_id_created_at_idx" ON "inquiry_internal_notes"("inquiry_id", "created_at");

-- CreateIndex
CREATE INDEX "inquiry_internal_notes_author_user_id_created_at_idx" ON "inquiry_internal_notes"("author_user_id", "created_at");

-- CreateIndex
CREATE INDEX "artworks_collection_id_locale_status_display_order_idx" ON "artworks"("collection_id", "locale", "status", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "press_items_locale_slug_key" ON "press_items"("locale", "slug");

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibition_artworks" ADD CONSTRAINT "exhibition_artworks_exhibition_id_fkey" FOREIGN KEY ("exhibition_id") REFERENCES "exhibitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibition_artworks" ADD CONSTRAINT "exhibition_artworks_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_media_placements" ADD CONSTRAINT "content_media_placements_media_object_id_fkey" FOREIGN KEY ("media_object_id") REFERENCES "media_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_source_revision_id_fkey" FOREIGN KEY ("source_revision_id") REFERENCES "content_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_related_artwork_id_fkey" FOREIGN KEY ("related_artwork_id") REFERENCES "artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_internal_notes" ADD CONSTRAINT "inquiry_internal_notes_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_internal_notes" ADD CONSTRAINT "inquiry_internal_notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
