-- The application reads and writes media only through `media_objects` and Garage.
-- Remove the obsolete storage table and its temporary Instagram linkage.
ALTER TABLE "instagram_posts"
  DROP CONSTRAINT IF EXISTS "instagram_posts_uploaded_file_id_fkey";

DROP INDEX IF EXISTS "instagram_posts_uploaded_file_id_key";

ALTER TABLE "instagram_posts"
  DROP COLUMN IF EXISTS "uploaded_file_id";

DROP TABLE IF EXISTS "uploaded_files";
