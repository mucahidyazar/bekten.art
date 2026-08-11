CREATE TYPE "StudioAccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "SiteLocaleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED');
CREATE TYPE "TextDirection" AS ENUM ('LTR', 'RTL');

ALTER TABLE "users"
  ADD COLUMN "studio_status" "StudioAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "invited_at" TIMESTAMP(3),
  ADD COLUMN "accepted_at" TIMESTAMP(3),
  ADD COLUMN "suspended_at" TIMESTAMP(3),
  ADD COLUMN "invited_by_user_id" UUID;

CREATE INDEX "users_studio_status_role_idx"
  ON "users"("studio_status", "role");
CREATE INDEX "users_invited_by_user_id_idx"
  ON "users"("invited_by_user_id");
ALTER TABLE "users"
  ADD CONSTRAINT "users_invited_by_user_id_fkey"
  FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "site_locales" (
  "code" VARCHAR(15) NOT NULL,
  "english_name" VARCHAR(80) NOT NULL,
  "native_name" VARCHAR(80) NOT NULL,
  "direction" "TextDirection" NOT NULL DEFAULT 'LTR',
  "status" "SiteLocaleStatus" NOT NULL DEFAULT 'DRAFT',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_by_id" UUID,
  "updated_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "site_locales_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "site_locales_status_sort_order_idx"
  ON "site_locales"("status", "sort_order");
CREATE INDEX "site_locales_created_by_id_idx"
  ON "site_locales"("created_by_id");
CREATE INDEX "site_locales_updated_by_id_idx"
  ON "site_locales"("updated_by_id");
CREATE UNIQUE INDEX "site_locales_one_default_key"
  ON "site_locales"("is_default") WHERE "is_default" = true;
ALTER TABLE "site_locales"
  ADD CONSTRAINT "site_locales_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_locales"
  ADD CONSTRAINT "site_locales_updated_by_id_fkey"
  FOREIGN KEY ("updated_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "site_locales"
  ("code", "english_name", "native_name", "direction", "status", "is_default", "sort_order", "updated_at")
VALUES
  ('en', 'English', 'English', 'LTR', 'ACTIVE', true, 0, CURRENT_TIMESTAMP),
  ('tr', 'Turkish', 'Türkçe', 'LTR', 'ACTIVE', false, 1, CURRENT_TIMESTAMP),
  ('ru', 'Russian', 'Русский', 'LTR', 'ACTIVE', false, 2, CURRENT_TIMESTAMP),
  ('ky', 'Kyrgyz', 'Кыргызча', 'LTR', 'ACTIVE', false, 3, CURRENT_TIMESTAMP);

ALTER TABLE "ui_translation_overrides"
  ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "ui_translation_overrides"
  ADD CONSTRAINT "ui_translation_overrides_locale_fkey"
  FOREIGN KEY ("locale") REFERENCES "site_locales"("code")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "artworks" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "collections" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "exhibitions" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "journal_entries" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "pages" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "news_articles" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "press_items" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "testimonials" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "workshop_items" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "memories" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "artist_stats" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "contact_info" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "feedback" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "newsletter_subscribers" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "content_revisions" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "inquiries" ALTER COLUMN "locale" TYPE VARCHAR(15);
ALTER TABLE "inquiries" ALTER COLUMN "related_artwork_locale" TYPE VARCHAR(15);

ALTER TABLE "artworks"
  ADD COLUMN "translation_group_id" UUID;
UPDATE "artworks" SET "translation_group_id" = "id";
ALTER TABLE "artworks"
  ALTER COLUMN "translation_group_id" SET NOT NULL,
  ALTER COLUMN "translation_group_id" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "artworks_translation_group_id_locale_key"
  ON "artworks"("translation_group_id", "locale");

ALTER TABLE "collections"
  ADD COLUMN "translation_group_id" UUID;
UPDATE "collections" SET "translation_group_id" = "id";
ALTER TABLE "collections"
  ALTER COLUMN "translation_group_id" SET NOT NULL,
  ALTER COLUMN "translation_group_id" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "collections_translation_group_id_locale_key"
  ON "collections"("translation_group_id", "locale");

ALTER TABLE "exhibitions"
  ADD COLUMN "translation_group_id" UUID;
UPDATE "exhibitions" SET "translation_group_id" = "id";
ALTER TABLE "exhibitions"
  ALTER COLUMN "translation_group_id" SET NOT NULL,
  ALTER COLUMN "translation_group_id" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "exhibitions_translation_group_id_locale_key"
  ON "exhibitions"("translation_group_id", "locale");

ALTER TABLE "journal_entries"
  ADD COLUMN "translation_group_id" UUID;
UPDATE "journal_entries" SET "translation_group_id" = "id";
ALTER TABLE "journal_entries"
  ALTER COLUMN "translation_group_id" SET NOT NULL,
  ALTER COLUMN "translation_group_id" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "journal_entries_translation_group_id_locale_key"
  ON "journal_entries"("translation_group_id", "locale");

ALTER TABLE "pages"
  ADD COLUMN "translation_group_id" UUID;
UPDATE "pages" SET "translation_group_id" = "id";
ALTER TABLE "pages"
  ALTER COLUMN "translation_group_id" SET NOT NULL,
  ALTER COLUMN "translation_group_id" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "pages_translation_group_id_locale_key"
  ON "pages"("translation_group_id", "locale");

ALTER TABLE "press_items"
  ADD COLUMN "translation_group_id" UUID;
UPDATE "press_items" SET "translation_group_id" = "id";
ALTER TABLE "press_items"
  ALTER COLUMN "translation_group_id" SET NOT NULL,
  ALTER COLUMN "translation_group_id" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "press_items_translation_group_id_locale_key"
  ON "press_items"("translation_group_id", "locale");

CREATE TABLE "media_folders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "parent_id" UUID,
  "name" VARCHAR(120) NOT NULL,
  "normalized_name" VARCHAR(120) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_folders_parent_name_key"
  ON "media_folders"("parent_id", "normalized_name") NULLS NOT DISTINCT;
CREATE INDEX "media_folders_parent_id_normalized_name_idx"
  ON "media_folders"("parent_id", "normalized_name");
CREATE INDEX "media_folders_created_by_id_idx"
  ON "media_folders"("created_by_id");
ALTER TABLE "media_folders"
  ADD CONSTRAINT "media_folders_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "media_folders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_folders"
  ADD CONSTRAINT "media_folders_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "media_objects"
  ADD COLUMN "folder_id" UUID,
  ADD COLUMN "display_name" VARCHAR(255),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
UPDATE "media_objects" SET "display_name" = "filename";
ALTER TABLE "media_objects"
  ALTER COLUMN "display_name" SET NOT NULL;
CREATE INDEX "media_objects_folder_id_created_at_idx"
  ON "media_objects"("folder_id", "created_at");
ALTER TABLE "media_objects"
  ADD CONSTRAINT "media_objects_folder_id_fkey"
  FOREIGN KEY ("folder_id") REFERENCES "media_folders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
