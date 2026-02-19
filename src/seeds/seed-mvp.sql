-- =============================================================================
-- MVP Seed Data (idempotent)
-- =============================================================================
-- Run after migrations. Safe to run multiple times.
-- Replace password_hash with real hashes for environments that need login.

BEGIN;

-- 1. Users (Identity Service)
-- password for all: "password" (bcrypt hash)
INSERT INTO users (id, email, password_hash, first_name, last_name, status)
VALUES
  ('a0000001-0000-4000-8000-000000000001', 'buyer@mvp.local',   '$2b$10$QG.atJ7yyJ6bELt1nincneHxxSxoq6R09MJ3uEHm5sVlqEZ41IjhW', 'Buyer',   'MVP', 'active'),
  ('a0000002-0000-4000-8000-000000000002', 'provider@mvp.local', '$2b$10$QG.atJ7yyJ6bELt1nincneHxxSxoq6R09MJ3uEHm5sVlqEZ41IjhW', 'Provider', 'MVP', 'active'),
  ('a0000003-0000-4000-8000-000000000003', 'admin@mvp.local',    '$2b$10$QG.atJ7yyJ6bELt1nincneHxxSxoq6R09MJ3uEHm5sVlqEZ41IjhW', 'Admin',   'MVP', 'active')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name  = EXCLUDED.last_name,
  status     = EXCLUDED.status,
  updated_at = now();

-- 2. Businesses (Business Service)
INSERT INTO businesses (id, legal_name, trading_name, business_type, status, default_currency)
VALUES ('b0000001-0000-4000-8000-000000000001', 'MVP Test Restaurant Ltd', 'MVP Test Restaurant', 'restaurant', 'active', 'GBP')
ON CONFLICT (id) DO NOTHING;

-- 3. Providers (Provider Service)
INSERT INTO providers (id, legal_name, trading_name, provider_type, status, default_currency)
VALUES ('c0000001-0000-4000-8000-000000000001', 'MVP Test Wholesaler Ltd', 'MVP Test Wholesaler', 'food_wholesaler', 'active', 'GBP')
ON CONFLICT (id) DO NOTHING;

-- 4. Business user membership (Identity Service)
INSERT INTO business_users (user_id, business_id, role)
VALUES ('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'business_owner')
ON CONFLICT (user_id, business_id) DO NOTHING;

-- 5. Provider user membership (Identity Service)
INSERT INTO provider_users (user_id, provider_id, role)
VALUES ('a0000002-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000001', 'provider_owner')
ON CONFLICT (user_id, provider_id) DO NOTHING;

-- 6. Location (Business Service: delivery address)
INSERT INTO locations (id, address_line_1, city, region, postal_code, country, location_type, owner_type, owner_id, is_default)
VALUES ('10000001-0000-4000-8000-000000000001', '1 High Street', 'London', 'Greater London', 'SW1A 1AA', 'GB', 'delivery_address', 'business', 'b0000001-0000-4000-8000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

UPDATE businesses
SET default_delivery_address_id = '10000001-0000-4000-8000-000000000001', updated_at = now()
WHERE id = 'b0000001-0000-4000-8000-000000000001';

-- 7. Products (Provider Service)
INSERT INTO products (id, provider_id, sku, name, category, unit, price, currency, tax_rate, is_active)
VALUES
  ('f0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'SKU001', 'Organic Tomatoes 1kg', 'fresh_produce', 'kg', 4.50, 'GBP', 0.00, true),
  ('f0000002-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000001', 'SKU002', 'Olive Oil 5L', 'dry_goods', 'unit', 28.00, 'GBP', 0.20, true),
  ('f0000003-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000001', 'SKU003', 'Pasta 1kg', 'dry_goods', 'unit', 2.20, 'GBP', 0.20, true)
ON CONFLICT (provider_id, sku) DO NOTHING;

-- 8. Order (Order Service) – status delivered so invoice/rating valid
INSERT INTO orders (
  id, order_number, business_id, provider_id, delivery_location_id,
  status, subtotal, tax_total, total, currency, requested_delivery_date,
  submitted_at, confirmed_at, delivered_at, created_at, updated_at
)
VALUES (
  '00000001-0000-4000-8000-000000000001', 'ORD-MVP-00001',
  'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', '10000001-0000-4000-8000-000000000001',
  'delivered', 32.50, 3.04, 35.54, 'GBP', (CURRENT_DATE + 1),
  now() - interval '3 days', now() - interval '3 days', now() - interval '1 day', now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- 9. Order lines (Order Service)
INSERT INTO order_lines (id, order_id, line_type, product_id, name, quantity, unit, unit_price, tax_rate, line_total)
VALUES
  ('e0000001-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'product', 'f0000001-0000-4000-8000-000000000001', 'Organic Tomatoes 1kg', 2, 'kg', 4.50, 0.00, 9.00),
  ('e0000002-0000-4000-8000-000000000002', '00000001-0000-4000-8000-000000000001', 'product', 'f0000002-0000-4000-8000-000000000002', 'Olive Oil 5L', 1, 'unit', 28.00, 0.20, 33.60)
ON CONFLICT (id) DO NOTHING;

-- 8b. Second test order (submitted – for provider to view/confirm)
INSERT INTO orders (
  id, order_number, business_id, provider_id, delivery_location_id,
  status, subtotal, tax_total, total, currency, requested_delivery_date,
  submitted_at, confirmed_at, delivered_at, created_at, updated_at
)
VALUES (
  '00000002-0000-4000-8000-000000000002', 'ORD-MVP-00002',
  'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', '10000001-0000-4000-8000-000000000001',
  'submitted', 13.20, 2.64, 15.84, 'GBP', (CURRENT_DATE + 3),
  now(), NULL, NULL, now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- 9b. Order lines for second order
INSERT INTO order_lines (id, order_id, line_type, product_id, name, quantity, unit, unit_price, tax_rate, line_total)
VALUES
  ('e0000003-0000-4000-8000-000000000003', '00000002-0000-4000-8000-000000000002', 'product', 'f0000003-0000-4000-8000-000000000003', 'Pasta 1kg', 6, 'unit', 2.20, 0.20, 13.20)
ON CONFLICT (id) DO NOTHING;

-- 10. Delivery (Logistics Service)
INSERT INTO deliveries (id, order_id, status, actual_delivery_at)
VALUES
  ('d0000001-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'delivered', now() - interval '1 day'),
  ('d0000002-0000-4000-8000-000000000002', '00000002-0000-4000-8000-000000000002', 'scheduled', NULL)
ON CONFLICT (id) DO NOTHING;

-- 11. Invoice (Payment Service)
INSERT INTO invoices (id, invoice_number, provider_id, business_id, status, subtotal, tax_total, total, currency, due_date, issued_at, paid_at)
VALUES (
  '90000001-0000-4000-8000-000000000001', 'INV-MVP-00001',
  'c0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001',
  'paid', 32.50, 3.04, 35.54, 'GBP', CURRENT_DATE + 14, now() - interval '2 days', now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 12. Invoice lines (Payment Service)
INSERT INTO invoice_lines (id, invoice_id, order_id, description, quantity, unit_price, line_total)
VALUES
  ('60000001-0000-4000-8000-000000000001', '90000001-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'Organic Tomatoes 1kg x 2', 2, 4.50, 9.00),
  ('60000002-0000-4000-8000-000000000002', '90000001-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'Olive Oil 5L x 1', 1, 28.00, 33.60)
ON CONFLICT (id) DO NOTHING;

-- 13. Payment (Payment Service)
INSERT INTO payments (id, invoice_id, business_id, amount, currency, status, method, paid_at)
VALUES ('70000001-0000-4000-8000-000000000001', '90000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 35.54, 'GBP', 'completed', 'card', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- 14. Rating (Trust Service)
INSERT INTO ratings (id, order_id, business_id, provider_id, rating, is_visible)
VALUES ('80000001-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 5, true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
