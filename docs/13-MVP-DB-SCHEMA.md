# MVP DB Schema and Migration Plan

## PostgreSQL schema for Mini-MVP

All entities map to service ownership from the Service Boundaries (09). MVP uses a single database; table ownership indicates which service is the single writer for that data.

---

## 1) Entity overview

| Table               | Owner service               | Description                                              |
| ------------------- | --------------------------- | -------------------------------------------------------- |
| users               | Identity Service            | User accounts and profile.                               |
| business_users      | Identity Service            | User–business membership and role.                       |
| provider_users      | Identity Service            | User–provider membership and role.                       |
| sessions            | Identity Service            | Auth sessions / refresh tokens (optional for JWT-only).  |
| businesses          | Business Service            | Buyer (hospitality) entities.                            |
| locations           | Business / Provider Service | Addresses; owner_type + owner_id = business or provider. |
| preferred_suppliers | Business Service            | Business shortlist of providers.                         |
| providers           | Provider Service            | Seller (supplier) entities.                              |
| products            | Provider Service            | Provider catalog (MVP: products only).                   |
| availability        | Provider Service            | Provider delivery windows / service area.                |
| orders              | Order Service               | Purchase orders (one per business–provider).             |
| order_lines         | Order Service               | Order line items (product snapshot).                     |
| deliveries          | Logistics Service           | Delivery status and tracking per order.                  |
| invoices            | Payment Service             | Invoices issued by provider to business.                 |
| invoice_lines       | Payment Service             | Invoice line items (link to order).                      |
| payments            | Payment Service             | Payments against invoices.                               |
| ratings             | Trust Service               | Buyer rating per order (1–5).                            |

---

## 2) Table definitions (fields, constraints, ownership, indexes)

### users

- **Owner:** Identity Service
- **Fields:** id (PK), email (UNIQUE NOT NULL), phone, password_hash (NOT NULL), first_name, last_name, avatar_url, email_verified_at, phone_verified_at, status (NOT NULL), locale, timezone, created_at (NOT NULL), updated_at (NOT NULL)
- **Defaults:** status = 'pending', created_at = now(), updated_at = now()
- **Indexes:** email (unique), status

### business_users

- **Owner:** Identity Service
- **Relations:** user_id → users(id), business_id → businesses(id). Unique (user_id, business_id).
- **Fields:** id (PK), user_id (FK NOT NULL), business_id (FK NOT NULL), role (NOT NULL), created_at, updated_at
- **Indexes:** (user_id, business_id) unique, business_id

### provider_users

- **Owner:** Identity Service
- **Relations:** user_id → users(id), provider_id → providers(id). Unique (user_id, provider_id).
- **Fields:** id (PK), user_id (FK NOT NULL), provider_id (FK NOT NULL), role (NOT NULL), created_at, updated_at
- **Indexes:** (user_id, provider_id) unique, provider_id

### sessions

- **Owner:** Identity Service
- **Fields:** id (PK), user_id (FK NOT NULL), token_hash (NOT NULL), expires_at (NOT NULL), revoked_at, created_at
- **Indexes:** user_id, token_hash, expires_at

### businesses

- **Owner:** Business Service
- **Fields:** id (PK), legal_name (NOT NULL), trading_name (NOT NULL), registration_number, tax_id, business_type (NOT NULL), status (NOT NULL), logo_url, default_currency (NOT NULL), default_delivery_address_id (FK → locations), created_at, updated_at
- **Defaults:** status = 'pending_verification', default_currency = 'GBP', created_at = now(), updated_at = now()
- **Indexes:** status

### locations

- **Owner:** Business Service (owner_type=business) / Provider Service (owner_type=provider)
- **Relations:** owner_id references businesses(id) or providers(id) by convention; no DB FK (polymorphic). delivery_location_id in orders → locations(id).
- **Fields:** id (PK), address_line_1 (NOT NULL), address_line_2, city (NOT NULL), region, postal_code (NOT NULL), country (NOT NULL), latitude, longitude, location_type (NOT NULL), owner_type (NOT NULL), owner_id (NOT NULL), is_default (NOT NULL), contact_name, contact_phone, delivery_instructions, created_at, updated_at
- **Constraints:** owner_type IN ('business', 'provider')
- **Defaults:** is_default = false, created_at = now(), updated_at = now()
- **Indexes:** (owner_type, owner_id), postal_code (for discovery)

### preferred_suppliers

- **Owner:** Business Service
- **Relations:** business_id → businesses(id), provider_id → providers(id). Unique (business_id, provider_id).
- **Fields:** id (PK), business_id (FK NOT NULL), provider_id (FK NOT NULL), notes, created_at, updated_at
- **Indexes:** (business_id, provider_id) unique, provider_id

### providers

- **Owner:** Provider Service
- **Fields:** id (PK), legal_name (NOT NULL), trading_name (NOT NULL), registration_number, tax_id, provider_type (NOT NULL), status (NOT NULL), logo_url, description, default_currency (NOT NULL), min_order_value, lead_time_hours, service_radius_km, created_at, updated_at
- **Defaults:** status = 'pending_verification', default_currency = 'GBP', created_at = now(), updated_at = now()
- **Indexes:** status, provider_type

### products

- **Owner:** Provider Service
- **Relations:** provider_id → providers(id)
- **Fields:** id (PK), provider_id (FK NOT NULL), sku (NOT NULL), name (NOT NULL), description, category (NOT NULL), unit (NOT NULL), unit_size, price (NOT NULL), currency (NOT NULL), tax_rate (NOT NULL), min_order_quantity, max_order_quantity, is_active (NOT NULL), image_urls (jsonb), created_at, updated_at
- **Constraints:** Unique (provider_id, sku)
- **Defaults:** is_active = true, created_at = now(), updated_at = now()
- **Indexes:** (provider_id, is_active), category

### availability

- **Owner:** Provider Service
- **Relations:** provider_id → providers(id)
- **Fields:** id (PK), provider_id (FK NOT NULL), availability_type (NOT NULL), day_of_week, start_time, end_time, valid_from, valid_until, region_postcodes (jsonb), radius_km, is_active (NOT NULL), created_at, updated_at
- **Defaults:** is_active = true, created_at = now(), updated_at = now()
- **Indexes:** provider_id

### orders

- **Owner:** Order Service
- **Relations:** business_id → businesses(id), provider_id → providers(id), delivery_location_id → locations(id)
- **Fields:** id (PK), order_number (UNIQUE NOT NULL), business_id (FK NOT NULL), provider_id (FK NOT NULL), delivery_location_id (FK NOT NULL), status (NOT NULL), subtotal (NOT NULL), tax_total (NOT NULL), delivery_fee, total (NOT NULL), currency (NOT NULL), requested_delivery_date (NOT NULL), requested_delivery_slot_start, requested_delivery_slot_end, notes, internal_notes, submitted_at, confirmed_at, delivered_at, cancellation_reason, cancelled_at, created_at, updated_at
- **Defaults:** status = 'draft', created_at = now(), updated_at = now()
- **Indexes:** (business_id, status, created_at), (provider_id, status), order_number unique

### order_lines

- **Owner:** Order Service
- **Relations:** order_id → orders(id), product_id → products(id) (nullable for future service lines)
- **Fields:** id (PK), order_id (FK NOT NULL), line_type (NOT NULL), product_id (FK), name (NOT NULL), quantity (NOT NULL), unit (NOT NULL), unit_price (NOT NULL), tax_rate (NOT NULL), line_total (NOT NULL), created_at, updated_at
- **Constraints:** line_type IN ('product', 'service'); product_id required when line_type = 'product' (application or check)
- **Defaults:** created_at = now(), updated_at = now()
- **Indexes:** order_id

### deliveries

- **Owner:** Logistics Service
- **Relations:** order_id → orders(id) UNIQUE
- **Fields:** id (PK), order_id (FK NOT NULL UNIQUE), status (NOT NULL), carrier, tracking_code, estimated_delivery_at, actual_delivery_at, proof_of_delivery_url, notes, created_at, updated_at
- **Defaults:** status = 'scheduled', created_at = now(), updated_at = now()
- **Indexes:** order_id unique, status

### invoices

- **Owner:** Payment Service
- **Relations:** provider_id → providers(id), business_id → businesses(id)
- **Fields:** id (PK), invoice_number (UNIQUE NOT NULL), provider_id (FK NOT NULL), business_id (FK NOT NULL), status (NOT NULL), subtotal (NOT NULL), tax_total (NOT NULL), total (NOT NULL), currency (NOT NULL), due_date (NOT NULL), issued_at, paid_at, created_at, updated_at
- **Defaults:** status = 'draft', created_at = now(), updated_at = now()
- **Indexes:** (provider_id, status), (business_id, status), invoice_number unique

### invoice_lines

- **Owner:** Payment Service
- **Relations:** invoice_id → invoices(id), order_id → orders(id) (nullable)
- **Fields:** id (PK), invoice_id (FK NOT NULL), order_id (FK), description (NOT NULL), quantity (NOT NULL), unit_price (NOT NULL), line_total (NOT NULL), created_at, updated_at
- **Indexes:** invoice_id

### payments

- **Owner:** Payment Service
- **Relations:** business_id → businesses(id). MVP: payable is invoice only; invoice_id (FK) or (payable_type, payable_id) polymorphic.
- **Fields:** id (PK), invoice_id (FK NOT NULL for MVP), business_id (FK NOT NULL), amount (NOT NULL), currency (NOT NULL), status (NOT NULL), method (NOT NULL), external_id, metadata (jsonb), paid_at, created_at, updated_at
- **Defaults:** created_at = now(), updated_at = now()
- **Indexes:** (invoice_id), (business_id), status

### ratings

- **Owner:** Trust Service
- **Relations:** order_id → orders(id), business_id → businesses(id), provider_id → providers(id). One rating per order (unique order_id).
- **Fields:** id (PK), order_id (FK NOT NULL UNIQUE), business_id (FK NOT NULL), provider_id (FK NOT NULL), rating (NOT NULL), dimensions (jsonb), comment, is_visible (NOT NULL), created_at, updated_at
- **Constraints:** rating BETWEEN 1 AND 5
- **Defaults:** is_visible = true, created_at = now(), updated_at = now()
- **Indexes:** order_id unique, provider_id (for aggregate queries)

---

## 3) CREATE TABLE statements (PostgreSQL)

Tables are ordered so that referenced tables exist before FKs. Enums are replaced by `VARCHAR` + `CHECK` for simplicity; replace with `CREATE TYPE` if preferred.

```sql
-- =============================================================================
-- MVP Schema (PostgreSQL)
-- =============================================================================

-- Extensions (optional, for uuid_generate_v4)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Users & identity
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(50),
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    avatar_url      VARCHAR(500),
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
    locale          VARCHAR(10) DEFAULT 'en_GB',
    timezone        VARCHAR(50) DEFAULT 'UTC',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status);

-- -----------------------------------------------------------------------------
-- 2. Businesses (no FK to users yet; business_users links them)
-- -----------------------------------------------------------------------------
CREATE TABLE businesses (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name                  VARCHAR(255) NOT NULL,
    trading_name                VARCHAR(255) NOT NULL,
    registration_number         VARCHAR(50),
    tax_id                      VARCHAR(50),
    business_type               VARCHAR(30) NOT NULL
        CHECK (business_type IN ('restaurant', 'cafe', 'bar', 'hotel', 'catering', 'other')),
    status                      VARCHAR(30) NOT NULL DEFAULT 'pending_verification'
        CHECK (status IN ('pending_verification', 'active', 'suspended', 'closed')),
    logo_url                    VARCHAR(500),
    default_currency            VARCHAR(3) NOT NULL DEFAULT 'GBP',
    default_delivery_address_id  UUID,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_businesses_status ON businesses (status);

-- -----------------------------------------------------------------------------
-- 3. Providers
-- -----------------------------------------------------------------------------
CREATE TABLE providers (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name           VARCHAR(255) NOT NULL,
    trading_name         VARCHAR(255) NOT NULL,
    registration_number  VARCHAR(50),
    tax_id               VARCHAR(50),
    provider_type        VARCHAR(50) NOT NULL
        CHECK (provider_type IN ('food_wholesaler', 'beverage_distributor', 'coffee_roaster', 'bakery', 'meat_fish', 'cleaning', 'equipment', 'logistics', 'producer', 'other')),
    status               VARCHAR(30) NOT NULL DEFAULT 'pending_verification'
        CHECK (status IN ('pending_verification', 'active', 'suspended', 'closed')),
    logo_url             VARCHAR(500),
    description          TEXT,
    default_currency     VARCHAR(3) NOT NULL DEFAULT 'GBP',
    min_order_value      NUMERIC(12, 2),
    lead_time_hours      INT,
    service_radius_km    NUMERIC(8, 2),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_providers_status ON providers (status);
CREATE INDEX idx_providers_provider_type ON providers (provider_type);

-- -----------------------------------------------------------------------------
-- 4. Identity: business_users, provider_users, sessions
-- -----------------------------------------------------------------------------
CREATE TABLE business_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    role        VARCHAR(30) NOT NULL
        CHECK (role IN ('business_owner', 'business_manager', 'business_staff')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, business_id)
);

CREATE INDEX idx_business_users_business_id ON business_users (business_id);

CREATE TABLE provider_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    role        VARCHAR(30) NOT NULL
        CHECK (role IN ('provider_owner', 'provider_manager', 'provider_staff')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider_id)
);

CREATE INDEX idx_provider_users_provider_id ON provider_users (provider_id);

CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_token_hash ON sessions (token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);

-- -----------------------------------------------------------------------------
-- 5. Locations (polymorphic owner: business or provider)
-- -----------------------------------------------------------------------------
CREATE TABLE locations (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_line_1       VARCHAR(255) NOT NULL,
    address_line_2       VARCHAR(100),
    city                 VARCHAR(100) NOT NULL,
    region               VARCHAR(100),
    postal_code          VARCHAR(20) NOT NULL,
    country              VARCHAR(2) NOT NULL,
    latitude             NUMERIC(10, 7),
    longitude            NUMERIC(10, 7),
    location_type        VARCHAR(30) NOT NULL
        CHECK (location_type IN ('business_premises', 'warehouse', 'delivery_address')),
    owner_type           VARCHAR(20) NOT NULL CHECK (owner_type IN ('business', 'provider')),
    owner_id             UUID NOT NULL,
    is_default           BOOLEAN NOT NULL DEFAULT false,
    contact_name         VARCHAR(100),
    contact_phone        VARCHAR(50),
    delivery_instructions TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_locations_owner ON locations (owner_type, owner_id);
CREATE INDEX idx_locations_postal_code ON locations (postal_code);

-- FK from businesses to locations: add after locations exist (avoids circular dependency)
ALTER TABLE businesses
    ADD CONSTRAINT fk_businesses_default_delivery
    FOREIGN KEY (default_delivery_address_id) REFERENCES locations (id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 6. Preferred suppliers, products, availability
-- -----------------------------------------------------------------------------
CREATE TABLE preferred_suppliers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (business_id, provider_id)
);

CREATE INDEX idx_preferred_suppliers_provider_id ON preferred_suppliers (provider_id);

CREATE TABLE products (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id        UUID NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    sku                VARCHAR(100) NOT NULL,
    name               VARCHAR(255) NOT NULL,
    description        TEXT,
    category           VARCHAR(50) NOT NULL,
    unit               VARCHAR(20) NOT NULL,
    unit_size          VARCHAR(50),
    price              NUMERIC(12, 2) NOT NULL,
    currency           VARCHAR(3) NOT NULL,
    tax_rate           NUMERIC(5, 4) NOT NULL,
    min_order_quantity NUMERIC(12, 3),
    max_order_quantity NUMERIC(12, 3),
    is_active          BOOLEAN NOT NULL DEFAULT true,
    image_urls         JSONB,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider_id, sku)
);

CREATE INDEX idx_products_provider_active ON products (provider_id, is_active);
CREATE INDEX idx_products_category ON products (category);

CREATE TABLE availability (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id       UUID NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    availability_type VARCHAR(30) NOT NULL
        CHECK (availability_type IN ('delivery_window', 'collection', 'service_area')),
    day_of_week       INT CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
    start_time        TIME,
    end_time          TIME,
    valid_from        DATE,
    valid_until       DATE,
    region_postcodes  JSONB,
    radius_km         NUMERIC(8, 2),
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_availability_provider_id ON availability (provider_id);

-- -----------------------------------------------------------------------------
-- 7. Orders and order lines
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number               VARCHAR(50) NOT NULL UNIQUE,
    business_id                UUID NOT NULL REFERENCES businesses (id) ON DELETE RESTRICT,
    provider_id                UUID NOT NULL REFERENCES providers (id) ON DELETE RESTRICT,
    delivery_location_id       UUID NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
    status                     VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
    subtotal                   NUMERIC(12, 2) NOT NULL,
    tax_total                  NUMERIC(12, 2) NOT NULL,
    delivery_fee               NUMERIC(12, 2),
    total                      NUMERIC(12, 2) NOT NULL,
    currency                   VARCHAR(3) NOT NULL,
    requested_delivery_date    DATE NOT NULL,
    requested_delivery_slot_start TIME,
    requested_delivery_slot_end   TIME,
    notes                      TEXT,
    internal_notes             TEXT,
    submitted_at               TIMESTAMPTZ,
    confirmed_at              TIMESTAMPTZ,
    delivered_at               TIMESTAMPTZ,
    cancellation_reason       VARCHAR(255),
    cancelled_at               TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_business_status_created ON orders (business_id, status, created_at DESC);
CREATE INDEX idx_orders_provider_status ON orders (provider_id, status);
CREATE UNIQUE INDEX idx_orders_order_number ON orders (order_number);

CREATE TABLE order_lines (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    line_type   VARCHAR(20) NOT NULL CHECK (line_type IN ('product', 'service')),
    product_id  UUID REFERENCES products (id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    quantity    NUMERIC(12, 3) NOT NULL,
    unit        VARCHAR(20) NOT NULL,
    unit_price  NUMERIC(12, 2) NOT NULL,
    tax_rate    NUMERIC(5, 4) NOT NULL,
    line_total  NUMERIC(12, 2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_lines_order_id ON order_lines (order_id);

-- -----------------------------------------------------------------------------
-- 8. Deliveries
-- -----------------------------------------------------------------------------
CREATE TABLE deliveries (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id              UUID NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
    status                VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'picked_up', 'in_transit', 'delivered', 'failed')),
    carrier               VARCHAR(100),
    tracking_code         VARCHAR(100),
    estimated_delivery_at TIMESTAMPTZ,
    actual_delivery_at    TIMESTAMPTZ,
    proof_of_delivery_url VARCHAR(500),
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_deliveries_order_id ON deliveries (order_id);
CREATE INDEX idx_deliveries_status ON deliveries (status);

-- -----------------------------------------------------------------------------
-- 9. Invoices, invoice lines, payments
-- -----------------------------------------------------------------------------
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number  VARCHAR(50) NOT NULL UNIQUE,
    provider_id     UUID NOT NULL REFERENCES providers (id) ON DELETE RESTRICT,
    business_id     UUID NOT NULL REFERENCES businesses (id) ON DELETE RESTRICT,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled')),
    subtotal        NUMERIC(12, 2) NOT NULL,
    tax_total       NUMERIC(12, 2) NOT NULL,
    total           NUMERIC(12, 2) NOT NULL,
    currency        VARCHAR(3) NOT NULL,
    due_date        DATE NOT NULL,
    issued_at       TIMESTAMPTZ,
    paid_at         TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_provider_status ON invoices (provider_id, status);
CREATE INDEX idx_invoices_business_status ON invoices (business_id, status);
CREATE UNIQUE INDEX idx_invoices_invoice_number ON invoices (invoice_number);

CREATE TABLE invoice_lines (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
    order_id    UUID REFERENCES orders (id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity    NUMERIC(12, 3) NOT NULL,
    unit_price  NUMERIC(12, 2) NOT NULL,
    line_total  NUMERIC(12, 2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_lines_invoice_id ON invoice_lines (invoice_id);

CREATE TABLE payments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id   UUID NOT NULL REFERENCES invoices (id) ON DELETE RESTRICT,
    business_id  UUID NOT NULL REFERENCES businesses (id) ON DELETE RESTRICT,
    amount       NUMERIC(12, 2) NOT NULL,
    currency     VARCHAR(3) NOT NULL,
    status       VARCHAR(20) NOT NULL
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    method       VARCHAR(30) NOT NULL
        CHECK (method IN ('card', 'bank_transfer', 'platform_balance', 'other')),
    external_id  VARCHAR(255),
    metadata     JSONB,
    paid_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_invoice_id ON payments (invoice_id);
CREATE INDEX idx_payments_business_id ON payments (business_id);
CREATE INDEX idx_payments_status ON payments (status);

-- -----------------------------------------------------------------------------
-- 10. Ratings
-- -----------------------------------------------------------------------------
CREATE TABLE ratings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    dimensions  JSONB,
    comment     TEXT,
    is_visible  BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ratings_order_id ON ratings (order_id);
CREATE INDEX idx_ratings_provider_id ON ratings (provider_id);
```

---

## 4) Migration order and FK dependency

1. **users** (no FKs)
2. **businesses** (no FKs to app tables; default_delivery_address_id added later)
3. **providers** (no FKs to app tables)
4. **business_users**, **provider_users**, **sessions** (FKs → users, businesses, providers)
5. **locations** (no FK to business/provider; polymorphic owner_id)
6. **ALTER businesses** add FK default_delivery_address_id → locations
7. **preferred_suppliers** (business_id, provider_id)
8. **products**, **availability** (provider_id)
9. **orders** (business_id, provider_id, delivery_location_id)
10. **order_lines** (order_id, product_id)
11. **deliveries** (order_id)
12. **invoices** (provider_id, business_id)
13. **invoice_lines** (invoice_id, order_id)
14. **payments** (invoice_id, business_id)
15. **ratings** (order_id, business_id, provider_id)

The SQL in section 3 follows this order. The only circular dependency is **businesses.default_delivery_address_id → locations**: create **locations** first without that FK, then add it with **ALTER TABLE** after **locations** exists.

---

## 5) Optional seed data for MVP testing

Minimal seed: one user (buyer), one business, one location, one user (provider), one provider, one product, one business_user, one provider_user. No orders/invoices so the DB stays valid with FKs.

```sql
-- Optional: seed for local/testing. Run after schema creation.
-- Uses explicit UUIDs for reproducibility; replace with gen_random_uuid() if preferred.

INSERT INTO users (id, email, password_hash, first_name, last_name, status)
VALUES
    ('a0000001-0000-4000-8000-000000000001', 'buyer@test.local', '$2a$10$dummy.hash.buyer', 'Buyer', 'Test', 'active'),
    ('a0000002-0000-4000-8000-000000000002', 'provider@test.local', '$2a$10$dummy.hash.provider', 'Provider', 'Test', 'active');

INSERT INTO businesses (id, legal_name, trading_name, business_type, status, default_currency)
VALUES
    ('b0000001-0000-4000-8000-000000000001', 'Test Restaurant Ltd', 'Test Restaurant', 'restaurant', 'active', 'GBP');

INSERT INTO providers (id, legal_name, trading_name, provider_type, status, default_currency)
VALUES
    ('p0000001-0000-4000-8000-000000000001', 'Test Wholesaler Ltd', 'Test Wholesaler', 'food_wholesaler', 'active', 'GBP');

INSERT INTO locations (id, address_line_1, city, region, postal_code, country, location_type, owner_type, owner_id, is_default)
VALUES
    ('l0000001-0000-4000-8000-000000000001', '1 High Street', 'London', 'Greater London', 'SW1A 1AA', 'GB', 'delivery_address', 'business', 'b0000001-0000-4000-8000-000000000001', true);

UPDATE businesses SET default_delivery_address_id = 'l0000001-0000-4000-8000-000000000001'
WHERE id = 'b0000001-0000-4000-8000-000000000001';

INSERT INTO business_users (user_id, business_id, role)
VALUES ('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'business_owner');

INSERT INTO provider_users (user_id, provider_id, role)
VALUES ('a0000002-0000-4000-8000-000000000002', 'p0000001-0000-4000-8000-000000000001', 'provider_owner');

INSERT INTO products (provider_id, sku, name, category, unit, price, currency, tax_rate, is_active)
VALUES ('p0000001-0000-4000-8000-000000000001', 'SKU001', 'Test Product', 'dry_goods', 'unit', 10.00, 'GBP', 0.20, true);
```

---

## 6) Data integrity and business rules (application + DB)

- **FKs:** All references use ON DELETE RESTRICT or CASCADE as in the SQL; orders/invoices/payments use RESTRICT so referenced business/provider/location are not deleted while in use.
- **Uniqueness:** One rating per order (order_id UNIQUE in ratings); one delivery per order (order_id UNIQUE in deliveries); (user_id, business_id) and (user_id, provider_id) in membership tables; (business_id, provider_id) in preferred_suppliers; (provider_id, sku) in products; order_number, invoice_number unique.
- **Enums:** status, role, type fields use CHECK constraints; replace with CREATE TYPE and column type if you standardise enums across the app.
- **Money:** NUMERIC(12,2) for amounts; currency in same table or ISO 4217.
- **Ownership:** No cross-service DB access; each service only writes its owned tables. Permissions (which role can see which fields) are enforced in the API layer (Permission Model 08), not by column-level DB roles for MVP.
