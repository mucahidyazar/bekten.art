-- This migration is intentionally additive. The legacy `section_data` and
-- `uploaded_files` tables remain available while their data is backfilled and
-- verified against the typed tables below.

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "NewsCategory" AS ENUM ('NEWS', 'FEATURE', 'INTERVIEW', 'EXHIBITION', 'BIOGRAPHY');
CREATE TYPE "PressCategory" AS ENUM ('INTERVIEW', 'REVIEW', 'FEATURE', 'NEWS');
CREATE TYPE "TestimonialCategory" AS ENUM ('ARTIST', 'BUSINESSPERSON', 'POLITICIAN', 'COLLECTOR', 'CRITIC', 'JOURNALIST', 'CURATOR');
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED', 'SPAM');
CREATE TYPE "NewsletterStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED');
CREATE TYPE "MediaVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "MediaStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED', 'QUARANTINED');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "artworks" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_alt" VARCHAR(300) NOT NULL,
    "object_key" VARCHAR(1024),
    "medium" VARCHAR(160),
    "dimensions" VARCHAR(120),
    "year" INTEGER,
    "price_minor" INTEGER,
    "currency" CHAR(3),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artworks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "artworks_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    CONSTRAINT "artworks_display_order_check" CHECK ("display_order" >= 0),
    CONSTRAINT "artworks_year_check" CHECK ("year" IS NULL OR "year" BETWEEN 1000 AND 3000),
    CONSTRAINT "artworks_price_check" CHECK (
      ("price_minor" IS NULL AND "currency" IS NULL) OR
      ("price_minor" >= 0 AND "currency" IS NOT NULL)
    ),
    CONSTRAINT "artworks_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL)
);

CREATE TABLE "news_articles" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subtitle" VARCHAR(300),
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "image_alt" VARCHAR(300),
    "object_key" VARCHAR(1024),
    "event_at" TIMESTAMP(3),
    "location" VARCHAR(200),
    "address" VARCHAR(300),
    "note" VARCHAR(500),
    "source_url" TEXT,
    "category" "NewsCategory" NOT NULL DEFAULT 'NEWS',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "news_articles_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    CONSTRAINT "news_articles_display_order_check" CHECK ("display_order" >= 0),
    CONSTRAINT "news_articles_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL)
);

CREATE TABLE "press_items" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subtitle" VARCHAR(300),
    "description" TEXT NOT NULL,
    "content" TEXT,
    "image_url" TEXT,
    "image_alt" VARCHAR(300),
    "object_key" VARCHAR(1024),
    "outlet" VARCHAR(200) NOT NULL,
    "source_url" TEXT NOT NULL,
    "published_on" DATE,
    "category" "PressCategory" NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "press_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "press_items_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    CONSTRAINT "press_items_display_order_check" CHECK ("display_order" >= 0),
    CONSTRAINT "press_items_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL)
);

CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "company" VARCHAR(150),
    "location" VARCHAR(150),
    "quote" TEXT NOT NULL,
    "avatar_url" TEXT,
    "avatar_alt" VARCHAR(300),
    "object_key" VARCHAR(1024),
    "category" "TestimonialCategory" NOT NULL,
    "source_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "testimonials_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    CONSTRAINT "testimonials_display_order_check" CHECK ("display_order" >= 0),
    CONSTRAINT "testimonials_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL)
);

CREATE TABLE "workshop_items" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "image_alt" VARCHAR(300),
    "object_key" VARCHAR(1024),
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "location" VARCHAR(200),
    "registration_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workshop_items_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    CONSTRAINT "workshop_items_dates_check" CHECK ("starts_at" IS NULL OR "ends_at" IS NULL OR "ends_at" > "starts_at"),
    CONSTRAINT "workshop_items_display_order_check" CHECK ("display_order" >= 0),
    CONSTRAINT "workshop_items_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL)
);

CREATE TABLE "memories" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_alt" VARCHAR(300) NOT NULL,
    "object_key" VARCHAR(1024),
    "captured_at" DATE,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "memories_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    CONSTRAINT "memories_display_order_check" CHECK ("display_order" >= 0),
    CONSTRAINT "memories_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL)
);

CREATE TABLE "artist_stats" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "value" VARCHAR(40) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_stats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "artist_stats_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    CONSTRAINT "artist_stats_display_order_check" CHECK ("display_order" >= 0),
    CONSTRAINT "artist_stats_publication_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL)
);

CREATE TABLE "contact_info" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "working_hours" VARCHAR(300),
    "map_embed_url" TEXT,
    "instagram_url" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "contact_info_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky'))
);

CREATE TABLE "feedback" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "rating" INTEGER,
    "source" VARCHAR(80) NOT NULL DEFAULT 'contact-form',
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "privacy_accepted_at" TIMESTAMP(3) NOT NULL,
    "purge_after" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feedback_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    CONSTRAINT "feedback_rating_check" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5),
    CONSTRAINT "feedback_resolution_check" CHECK (
      ("status" = 'RESOLVED' AND "resolved_at" IS NOT NULL) OR
      ("status" <> 'RESOLVED')
    )
);

CREATE TABLE "newsletter_subscribers" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "source" VARCHAR(80) NOT NULL,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'PENDING',
    "consented_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "unsubscribed_at" TIMESTAMP(3),
    "confirmation_token_hash" VARCHAR(128),
    "unsubscribe_token_hash" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "newsletter_subscribers_locale_check" CHECK ("locale" IN ('en', 'tr', 'ru', 'ky'))
);

CREATE TABLE "media_objects" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(32) NOT NULL DEFAULT 'garage',
    "object_key" VARCHAR(1024) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(127) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum_sha256" CHAR(64) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOADING',
    "uploaded_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_objects_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "media_objects_provider_check" CHECK ("provider" = 'garage'),
    CONSTRAINT "media_objects_size_check" CHECK ("size_bytes" >= 0),
    CONSTRAINT "media_objects_dimensions_check" CHECK (
      ("width" IS NULL OR "width" > 0) AND ("height" IS NULL OR "height" > 0)
    ),
    CONSTRAINT "media_objects_checksum_check" CHECK ("checksum_sha256" ~ '^[a-f0-9]{64}$')
);

CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" VARCHAR(160),
    "request_id" VARCHAR(160),
    "ip_hash" VARCHAR(128),
    "user_agent" VARCHAR(1000),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outbox_jobs" (
    "id" UUID NOT NULL,
    "type" VARCHAR(120) NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotency_key" VARCHAR(200) NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 10,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "locked_by" VARCHAR(160),
    "last_error" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "outbox_jobs_attempts_check" CHECK (
      "attempts" >= 0 AND "max_attempts" > 0 AND "attempts" <= "max_attempts"
    )
);

-- This physical shape is shared with the stable NextAuth v4 rate limiter.
CREATE TABLE "auth_rate_limits" (
    "action" VARCHAR(120) NOT NULL,
    "key" CHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("action", "key"),
    CONSTRAINT "auth_rate_limits_attempts_check" CHECK ("attempts" >= 0),
    CONSTRAINT "auth_rate_limits_key_check" CHECK ("key" ~ '^[a-f0-9]{64}$')
);

-- CreateIndex
CREATE INDEX "artworks_locale_status_display_order_idx" ON "artworks"("locale", "status", "display_order");
CREATE INDEX "artworks_status_published_at_idx" ON "artworks"("status", "published_at");
CREATE UNIQUE INDEX "artworks_locale_slug_key" ON "artworks"("locale", "slug");
CREATE INDEX "news_articles_locale_status_display_order_idx" ON "news_articles"("locale", "status", "display_order");
CREATE INDEX "news_articles_status_published_at_idx" ON "news_articles"("status", "published_at");
CREATE INDEX "news_articles_event_at_idx" ON "news_articles"("event_at");
CREATE UNIQUE INDEX "news_articles_locale_slug_key" ON "news_articles"("locale", "slug");
CREATE INDEX "press_items_locale_status_display_order_idx" ON "press_items"("locale", "status", "display_order");
CREATE INDEX "press_items_status_published_at_idx" ON "press_items"("status", "published_at");
CREATE INDEX "testimonials_locale_status_display_order_idx" ON "testimonials"("locale", "status", "display_order");
CREATE INDEX "testimonials_status_published_at_idx" ON "testimonials"("status", "published_at");
CREATE INDEX "workshop_items_locale_status_display_order_idx" ON "workshop_items"("locale", "status", "display_order");
CREATE INDEX "workshop_items_status_published_at_idx" ON "workshop_items"("status", "published_at");
CREATE UNIQUE INDEX "workshop_items_locale_slug_key" ON "workshop_items"("locale", "slug");
CREATE INDEX "memories_locale_status_display_order_idx" ON "memories"("locale", "status", "display_order");
CREATE INDEX "memories_status_published_at_idx" ON "memories"("status", "published_at");
CREATE UNIQUE INDEX "memories_locale_slug_key" ON "memories"("locale", "slug");
CREATE INDEX "artist_stats_locale_status_display_order_idx" ON "artist_stats"("locale", "status", "display_order");
CREATE INDEX "artist_stats_status_published_at_idx" ON "artist_stats"("status", "published_at");
CREATE UNIQUE INDEX "contact_info_locale_key" ON "contact_info"("locale");
CREATE INDEX "contact_info_is_primary_idx" ON "contact_info"("is_primary");
CREATE INDEX "feedback_status_created_at_idx" ON "feedback"("status", "created_at");
CREATE INDEX "feedback_email_created_at_idx" ON "feedback"("email", "created_at");
CREATE INDEX "feedback_purge_after_idx" ON "feedback"("purge_after");
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");
CREATE UNIQUE INDEX "newsletter_subscribers_confirmation_token_hash_key" ON "newsletter_subscribers"("confirmation_token_hash");
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_hash_key" ON "newsletter_subscribers"("unsubscribe_token_hash");
CREATE INDEX "newsletter_subscribers_status_created_at_idx" ON "newsletter_subscribers"("status", "created_at");
CREATE UNIQUE INDEX "media_objects_object_key_key" ON "media_objects"("object_key");
CREATE INDEX "media_objects_status_created_at_idx" ON "media_objects"("status", "created_at");
CREATE INDEX "media_objects_visibility_status_idx" ON "media_objects"("visibility", "status");
CREATE INDEX "media_objects_checksum_sha256_idx" ON "media_objects"("checksum_sha256");
CREATE INDEX "audit_events_actor_user_id_created_at_idx" ON "audit_events"("actor_user_id", "created_at");
CREATE INDEX "audit_events_entity_type_entity_id_created_at_idx" ON "audit_events"("entity_type", "entity_id", "created_at");
CREATE INDEX "audit_events_action_created_at_idx" ON "audit_events"("action", "created_at");
CREATE UNIQUE INDEX "outbox_jobs_idempotency_key_key" ON "outbox_jobs"("idempotency_key");
CREATE INDEX "outbox_jobs_status_available_at_idx" ON "outbox_jobs"("status", "available_at");
CREATE INDEX "outbox_jobs_locked_at_idx" ON "outbox_jobs"("locked_at");
CREATE INDEX "auth_rate_limits_window_start_idx" ON "auth_rate_limits"("window_start");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
