CREATE TABLE "email_webhook_events" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "external_id" VARCHAR(200) NOT NULL,
    "event_type" VARCHAR(120) NOT NULL,
    "provider_message_id" VARCHAR(160) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_webhook_events_provider_external_id_key"
ON "email_webhook_events"("provider", "external_id");

CREATE INDEX "email_webhook_events_event_type_occurred_at_idx"
ON "email_webhook_events"("event_type", "occurred_at");

CREATE INDEX "email_webhook_events_provider_message_id_idx"
ON "email_webhook_events"("provider_message_id");
