CREATE TABLE "ui_translation_overrides" (
    "id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "key" VARCHAR(300) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_translation_overrides_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ui_translation_overrides_locale_check"
      CHECK ("locale" IN ('en', 'tr', 'ru', 'ky')),
    CONSTRAINT "ui_translation_overrides_key_check"
      CHECK (char_length("key") BETWEEN 1 AND 300),
    CONSTRAINT "ui_translation_overrides_value_check"
      CHECK (char_length(btrim("value")) BETWEEN 1 AND 5000)
);

CREATE UNIQUE INDEX "ui_translation_overrides_locale_key_key"
  ON "ui_translation_overrides"("locale", "key");
CREATE INDEX "ui_translation_overrides_key_idx"
  ON "ui_translation_overrides"("key");
CREATE INDEX "ui_translation_overrides_updated_by_user_id_idx"
  ON "ui_translation_overrides"("updated_by_user_id");

ALTER TABLE "ui_translation_overrides"
  ADD CONSTRAINT "ui_translation_overrides_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
