-- Límite de usos opcional por promoción
ALTER TABLE "promotion" ADD COLUMN IF NOT EXISTS "usage_limit" integer;
ALTER TABLE "promotion" ADD COLUMN IF NOT EXISTS "usage_count" integer NOT NULL DEFAULT 0;
