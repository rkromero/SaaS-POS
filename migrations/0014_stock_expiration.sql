-- Stock expiration tracking: batch-level inventory with FEFO support

-- stock_batch: tracks individual lots per stock record with expiration dates
CREATE TABLE IF NOT EXISTS stock_batch (
  id serial PRIMARY KEY,
  stock_id integer NOT NULL REFERENCES stock(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  expiration_date date,                      -- NULL = no expira
  batch_number text,                         -- número de lote opcional
  notes text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX stock_batch_stock_idx ON stock_batch(stock_id);
-- FEFO: ordered by expiration_date ASC NULLS LAST
CREATE INDEX stock_batch_expiration_idx ON stock_batch(stock_id, expiration_date ASC NULLS LAST);

-- expiration_alert_config: thresholds per org (multiple rows = multiple thresholds)
CREATE TABLE IF NOT EXISTS expiration_alert_config (
  id serial PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  threshold_days integer NOT NULL,           -- alertar N días antes del vencimiento
  email_enabled boolean DEFAULT false NOT NULL,
  in_app_enabled boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX expiration_alert_config_org_idx ON expiration_alert_config(organization_id);
CREATE UNIQUE INDEX expiration_alert_config_unique_idx ON expiration_alert_config(organization_id, threshold_days);

-- expiration_alert_log: prevents duplicate alerts per batch per threshold per day
CREATE TABLE IF NOT EXISTS expiration_alert_log (
  id serial PRIMARY KEY,
  organization_id text NOT NULL,
  stock_batch_id integer NOT NULL REFERENCES stock_batch(id) ON DELETE CASCADE,
  threshold_days integer NOT NULL,
  alerted_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX expiration_alert_log_org_idx ON expiration_alert_log(organization_id);
CREATE UNIQUE INDEX expiration_alert_log_unique_idx ON expiration_alert_log(stock_batch_id, threshold_days);
