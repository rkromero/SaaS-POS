-- Tabla de configuración ARCA por local (aplicada manualmente, tabla omitida en 0008)
CREATE TABLE IF NOT EXISTS "location_arca_config" (
  "location_id" integer PRIMARY KEY NOT NULL,
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

DO $$ BEGIN
  ALTER TABLE "location_arca_config"
    ADD CONSTRAINT "location_arca_config_location_id_fk"
    FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
