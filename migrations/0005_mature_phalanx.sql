CREATE TYPE "public"."expense_category" AS ENUM('supplies', 'utilities', 'rent', 'salary', 'maintenance', 'other');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expense" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"location_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"category" "expense_category" NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense" ADD CONSTRAINT "expense_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expense_org_idx" ON "expense" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expense_location_date_idx" ON "expense" USING btree ("location_id","date");