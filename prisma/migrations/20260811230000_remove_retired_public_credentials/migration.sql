-- Public password authentication was retired in V2. Remove credential material
-- so a database disclosure cannot expose obsolete password hashes or reset tokens.
DROP TABLE IF EXISTS "password_reset_tokens";

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "password_hash",
  DROP COLUMN IF EXISTS "password_reset_required";
