-- Configuración ARCA (ex-AFIP) por organización
CREATE TABLE "arca_config" (
  "organization_id" text PRIMARY KEY NOT NULL,
  "cuit" text NOT NULL,
  "razon_social" text NOT NULL,
  "punto_venta" integer NOT NULL,
  "tipo_contribuyente" text NOT NULL,
  "ambiente" text NOT NULL DEFAULT 'sandbox',
  "cert" text,
  "private_key" text,
  "is_active" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Campos de facturación electrónica en ventas
ALTER TABLE "sale" ADD COLUMN IF NOT EXISTS "cae" text;
ALTER TABLE "sale" ADD COLUMN IF NOT EXISTS "cae_vencimiento" text;
ALTER TABLE "sale" ADD COLUMN IF NOT EXISTS "invoice_number" integer;
ALTER TABLE "sale" ADD COLUMN IF NOT EXISTS "invoice_type" text;
ALTER TABLE "sale" ADD COLUMN IF NOT EXISTS "invoice_full_number" text;
