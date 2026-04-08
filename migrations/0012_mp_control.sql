-- Control MP: OAuth fields en organization + tabla mp_notification

ALTER TABLE "organization"
  ADD COLUMN "mp_oauth_access_token" text,
  ADD COLUMN "mp_oauth_refresh_token" text,
  ADD COLUMN "mp_oauth_user_id" text,
  ADD COLUMN "mp_webhook_id" text;

CREATE TABLE "mp_notification" (
  "id" serial PRIMARY KEY,
  "org_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "mp_notification_id" text NOT NULL,
  "topic" text NOT NULL,
  "action" text,
  "resource_id" text,
  "status" text,
  "amount" numeric(15, 2),
  "description" text,
  "payer_email" text,
  "payer_name" text,
  "payment_method_id" text,
  "payment_type_id" text,
  "external_reference" text,
  "raw_payload" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "mp_notif_org_idx" ON "mp_notification" ("org_id");
CREATE UNIQUE INDEX "mp_notif_unique_idx" ON "mp_notification" ("org_id", "mp_notification_id");
