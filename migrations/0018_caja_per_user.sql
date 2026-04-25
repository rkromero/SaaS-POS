-- Migration: Per-user cash register sessions
-- Adds auto_closed status, links sales to sessions, adds user-level index

-- Add auto_closed to the cash_register_status enum
ALTER TYPE cash_register_status ADD VALUE IF NOT EXISTS 'auto_closed';

-- Link each sale to a cash register session (nullable for backward compat)
ALTER TABLE sale ADD COLUMN IF NOT EXISTS cash_register_session_id INTEGER REFERENCES cash_register_session(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS sale_session_idx ON sale(cash_register_session_id);

-- Per-user open session lookup (used on every sale and POS load)
CREATE INDEX IF NOT EXISTS cash_session_user_status_idx ON cash_register_session(user_id, status);
