-- Agrega campo barcode a la tabla product
-- Separado del SKU: barcode = código impreso en el producto (EAN-13, UPC, etc.)
-- SKU = código interno del negocio
ALTER TABLE "product" ADD COLUMN "barcode" text;

-- Índice para búsqueda rápida por código de barras en el escáner del POS y stock
CREATE INDEX IF NOT EXISTS "product_barcode_idx" ON "product" ("barcode");
