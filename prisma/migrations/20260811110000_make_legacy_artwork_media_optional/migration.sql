-- V2 uses typed Garage-backed content_media_placements. These legacy columns
-- remain available during cutover but must not force fake placeholder values.
ALTER TABLE "artworks"
  ALTER COLUMN "image_url" DROP NOT NULL,
  ALTER COLUMN "image_alt" DROP NOT NULL;

-- Rollback strategy: only after every V2 artwork has real legacy fallback
-- values, restore both NOT NULL constraints in a separately verified release.
