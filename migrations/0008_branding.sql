-- Tabla de personalización visual por organización (planes de pago)
CREATE TABLE "branding" (
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
