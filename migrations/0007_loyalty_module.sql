CREATE TYPE "public"."license_type" AS ENUM('none', 'becada');--> statement-breakpoint
CREATE TYPE "public"."loyalty_reward_type" AS ENUM('product', 'discount_fixed', 'discount_percent');--> statement-breakpoint
CREATE TYPE "public"."loyalty_transaction_type" AS ENUM('earn', 'redeem', 'expire', 'adjust');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'fiado';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arca_config" (
	"organization_id" text PRIMARY KEY NOT NULL,
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
CREATE TABLE IF NOT EXISTS "branding" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"logo_url" text,
	"favicon_url" text,
	"primary_color" text,
	"business_name" text,
	"receipt_show_logo" boolean DEFAULT true NOT NULL,
	"receipt_address" text,
	"receipt_phone" text,
	"receipt_cuit" text,
	"receipt_footer" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_config" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"pesos_per_point" numeric(10, 2) DEFAULT '1000' NOT NULL,
	"min_points_to_redeem" integer DEFAULT 0 NOT NULL,
	"points_expiry_days" integer,
	"updated_by_user_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_redemption" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" integer NOT NULL,
	"customer_name" text NOT NULL,
	"reward_id" integer,
	"reward_name" text NOT NULL,
	"points_spent" integer NOT NULL,
	"discount_applied" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sale_id" integer,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_reward" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "loyalty_reward_type" NOT NULL,
	"points_cost" integer NOT NULL,
	"discount_value" numeric(10, 2),
	"product_id" integer,
	"stock" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" integer NOT NULL,
	"type" "loyalty_transaction_type" NOT NULL,
	"points" integer NOT NULL,
	"sale_id" integer,
	"redemption_id" integer,
	"description" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mp_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_module" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"module_name" text NOT NULL,
	"enabled_by_user_id" text NOT NULL,
	"enabled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_register_session" ADD COLUMN "opening_posnet" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cash_register_session" ADD COLUMN "opening_mercadopago" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cash_register_session" ADD COLUMN "opening_envios" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cash_register_session" ADD COLUMN "closing_posnet" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cash_register_session" ADD COLUMN "closing_mercadopago" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cash_register_session" ADD COLUMN "closing_envios" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cash_register_session" ADD COLUMN "difference_posnet" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cash_register_session" ADD COLUMN "difference_mercadopago" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cash_register_session" ADD COLUMN "difference_envios" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "license_type" "license_type" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "mp_oauth_access_token" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "mp_oauth_refresh_token" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "mp_oauth_user_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "mp_webhook_id" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "sale" ADD COLUMN "cae" text;--> statement-breakpoint
ALTER TABLE "sale" ADD COLUMN "cae_vencimiento" text;--> statement-breakpoint
ALTER TABLE "sale" ADD COLUMN "invoice_number" integer;--> statement-breakpoint
ALTER TABLE "sale" ADD COLUMN "invoice_type" text;--> statement-breakpoint
ALTER TABLE "sale" ADD COLUMN "invoice_full_number" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_redemption" ADD CONSTRAINT "loyalty_redemption_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_redemption" ADD CONSTRAINT "loyalty_redemption_reward_id_loyalty_reward_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."loyalty_reward"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_redemption" ADD CONSTRAINT "loyalty_redemption_sale_id_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_reward" ADD CONSTRAINT "loyalty_reward_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_transaction" ADD CONSTRAINT "loyalty_transaction_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_transaction" ADD CONSTRAINT "loyalty_transaction_sale_id_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mp_notification" ADD CONSTRAINT "mp_notification_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_module" ADD CONSTRAINT "org_module_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_redemption_customer_idx" ON "loyalty_redemption" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_redemption_org_idx" ON "loyalty_redemption" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_reward_org_idx" ON "loyalty_reward" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_tx_customer_idx" ON "loyalty_transaction" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_tx_org_idx" ON "loyalty_transaction" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_tx_sale_idx" ON "loyalty_transaction" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mp_notif_org_idx" ON "mp_notification" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mp_notif_unique_idx" ON "mp_notification" USING btree ("org_id","mp_notification_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_module_org_idx" ON "org_module" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "org_module_unique_idx" ON "org_module" USING btree ("org_id","module_name");