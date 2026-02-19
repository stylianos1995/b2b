-- Add allowed_sizes column to products (if migration was not run).
-- Run with: psql $DATABASE_URL -f scripts/add-allowed-sizes.sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS allowed_sizes jsonb;
