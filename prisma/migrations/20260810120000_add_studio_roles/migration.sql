-- Studio role values must commit before a later migration can query or assign
-- them. PostgreSQL rejects unsafe use of enum labels added in the current
-- transaction, so this deliberately small migration is a separate checkpoint.
--
-- Rollback strategy: retain the additive labels unused. PostgreSQL enum-label
-- removal is destructive; the application compatibility branch continues to
-- understand ADMIN until verified operators are migrated in the next step.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EDITOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OWNER';
