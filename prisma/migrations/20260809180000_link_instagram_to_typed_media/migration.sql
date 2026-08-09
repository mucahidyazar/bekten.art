-- Move Instagram runtime reads to the typed media catalog. The old
-- uploaded_file_id column remains only as a temporary migration aid until the
-- verified PocketBase-to-Garage cutover removes the legacy table.
ALTER TABLE "instagram_posts"
  ADD COLUMN "media_object_id" UUID;

UPDATE "instagram_posts" AS post
   SET "media_object_id" = post."uploaded_file_id"
 WHERE EXISTS (
   SELECT 1
     FROM "media_objects" AS media
    WHERE media."id" = post."uploaded_file_id"
 );

CREATE UNIQUE INDEX "instagram_posts_media_object_id_key"
  ON "instagram_posts"("media_object_id");

ALTER TABLE "instagram_posts"
  ADD CONSTRAINT "instagram_posts_media_object_id_fkey"
  FOREIGN KEY ("media_object_id") REFERENCES "media_objects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
