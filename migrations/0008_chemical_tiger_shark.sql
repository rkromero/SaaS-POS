CREATE TYPE "public"."promotion_discount_scope" AS ENUM('product', 'category', 'total');--> statement-breakpoint
CREATE TYPE "public"."promotion_discount_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."promotion_type" AS ENUM('product_price', 'discount', 'combo');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'mercadopago' BEFORE 'transfer';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expiration_alert_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"threshold_days" integer NOT NULL,
	"email_enabled" boolean DEFAULT false NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expiration_alert_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"stock_batch_id" integer NOT NULL,
	"threshold_days" integer NOT NULL,
	"alerted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "location_arca_config" (
	"location_id" integer PRIMARY KEY NOT NULL,
	"cuit" text NOT NULL,
	"razon_social" text NOT NULL,
	"punto_venta" integer NOT NULL,
	"tipo_contribuyente" text NOT NULL,
	"ambiente" text DEFAULT 'sandbox' NOT NULL,
	"cert" text,
	"private_key" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotion_combo_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"promotion_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotion" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "promotion_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_stackable" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"target_product_id" integer,
	"promo_price" numeric(10, 2),
	"discount_type" "promotion_discount_type",
	"discount_value" numeric(10, 2),
	"discount_scope" "promotion_discount_scope",
	"target_category_id" integer,
	"combo_price" numeric(10, 2),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_batch" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"expiration_date" date,
	"batch_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sale_item" ADD COLUMN "promotion_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expiration_alert_config" ADD CONSTRAINT "expiration_alert_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expiration_alert_log" ADD CONSTRAINT "expiration_alert_log_stock_batch_id_stock_batch_id_fk" FOREIGN KEY ("stock_batch_id") REFERENCES "public"."stock_batch"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "location_arca_config" ADD CONSTRAINT "location_arca_config_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotion_combo_item" ADD CONSTRAINT "promotion_combo_item_promotion_id_promotion_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotion"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotion_combo_item" ADD CONSTRAINT "promotion_combo_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotion" ADD CONSTRAINT "promotion_target_product_id_product_id_fk" FOREIGN KEY ("target_product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotion" ADD CONSTRAINT "promotion_target_category_id_category_id_fk" FOREIGN KEY ("target_category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_stock_id_stock_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expiration_alert_config_org_idx" ON "expiration_alert_config" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "expiration_alert_config_unique_idx" ON "expiration_alert_config" USING btree ("organization_id","threshold_days");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expiration_alert_log_org_idx" ON "expiration_alert_log" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "expiration_alert_log_unique_idx" ON "expiration_alert_log" USING btree ("stock_batch_id","threshold_days");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "combo_item_promotion_idx" ON "promotion_combo_item" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotion_org_idx" ON "promotion" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotion_org_active_idx" ON "promotion" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_batch_stock_idx" ON "stock_batch" USING btree ("stock_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_batch_expiration_idx" ON "stock_batch" USING btree ("stock_id","expiration_date");