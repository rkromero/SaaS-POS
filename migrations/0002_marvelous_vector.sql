CREATE TYPE "public"."plan_type" AS ENUM('free', 'socio', 'basic', 'pro', 'enterprise');--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "plan_type" "plan_type" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "mp_preapproval_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "mp_plan_status" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "plan_expires_at" timestamp;