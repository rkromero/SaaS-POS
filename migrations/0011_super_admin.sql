-- Super admin: license_type en organization + tabla org_module para feature flags
CREATE TYPE "license_type" AS ENUM ('none', 'becada');

ALTER TABLE "organization"
  ADD COLUMN "license_type" "license_type" DEFAULT 'none' NOT NULL;

CREATE TABLE "org_module" (
  "id" serial PRIMARY KEY,
  "org_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "module_name" text NOT NULL,
  "enabled_by_user_id" text NOT NULL,
  "enabled_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "org_module_unique" UNIQUE("org_id", "module_name")
);

CREATE INDEX "org_module_org_idx" ON "org_module" ("org_id");
