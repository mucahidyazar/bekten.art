-- Incremented on password reset so stateless JWT sessions can be revoked.
ALTER TABLE "users"
ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;
