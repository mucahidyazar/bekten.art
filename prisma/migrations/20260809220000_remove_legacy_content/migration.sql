-- Typed domain tables are the only application content source after the
-- production backfill and count verification.
DROP TABLE IF EXISTS "section_data";
DROP TABLE IF EXISTS "sections";
DROP TYPE IF EXISTS "SectionType";
