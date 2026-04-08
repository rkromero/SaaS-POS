-- Agregar columnas de fondos iniciales y cierres por método de pago
-- Posnet, MercadoPago y Plataforma de Envíos en apertura y cierre de caja

ALTER TABLE "cash_register_session"
  ADD COLUMN "opening_posnet" numeric(10, 2),
  ADD COLUMN "opening_mercadopago" numeric(10, 2),
  ADD COLUMN "opening_envios" numeric(10, 2),
  ADD COLUMN "closing_posnet" numeric(10, 2),
  ADD COLUMN "closing_mercadopago" numeric(10, 2),
  ADD COLUMN "closing_envios" numeric(10, 2),
  ADD COLUMN "difference_posnet" numeric(10, 2),
  ADD COLUMN "difference_mercadopago" numeric(10, 2),
  ADD COLUMN "difference_envios" numeric(10, 2);
