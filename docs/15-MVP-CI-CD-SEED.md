# MVP CI/CD Pipeline and DB Seeding

## Development, deployment, and seed data strategy

Aligned with MVP Feature Map (11), API Skeleton (12), DB Schema (13), and Integration Test Plan (14). MVP only; no frontend/UI.

---

# Part 1: CI/CD Pipeline

## 1.1 Pipeline overview

| Stage             | Purpose                             | Triggers                                      |
| ----------------- | ----------------------------------- | --------------------------------------------- |
| Validate          | Lint, format, type/schema checks    | Every push, every PR                          |
| Migrate           | Run DB migrations (test DB)         | PR to main; before integration tests          |
| Contract          | API contract vs skeleton (optional) | PR to main                                    |
| Test              | Unit + integration tests            | PR to main; push to main                      |
| Build             | Build deployable artifact           | PR to main; push to main                      |
| Deploy Staging    | Deploy to staging env               | Push to main (or manual)                      |
| Deploy Production | Deploy to production                | Manual approval or tagged release             |
| Rollback          | Revert failed deploy                | Manual (or automated on health check failure) |

---

## 1.2 Triggers

| Trigger                       | Actions                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Push to feature branch**    | Run Validate only (lint, format, type check). Optional: run unit tests.                                                      |
| **Pull request to main**      | Validate → Migrate (test DB) → Contract (if implemented) → Test (unit + integration) → Build. Block merge if any step fails. |
| **Merge to main**             | Run full pipeline: Validate → Migrate → Test → Build → Deploy Staging. Optionally notify.                                    |
| **Manual: Deploy Production** | Deploy from last successful staging build (or from tagged artifact). Require approval if configured.                         |
| **Manual: Rollback**          | Deploy previous known-good artifact; run migrations backward if needed (see Rollback).                                       |

---

## 1.3 Pipeline steps (detailed)

### Step 1: Code linting and formatting

- **Purpose:** Enforce style and catch obvious errors before type check and tests.
- **Commands (example):**
  - Lint: `npm run lint` or `pnpm lint` (e.g. ESLint with project config).
  - Format check: `npm run format:check` or `prettier --check "src/**/*.{ts,tsx,js,jsx}"`.
  - Backend: same or separate config under `backend/` or `apps/api/`.
- **Failure:** Pipeline fails; fix before merge.
- **Placeholder:**  
  `./scripts/ci-lint.sh` → runs lint + format check for monorepo (e.g. `lint` in root and in `apps/api`).

---

### Step 2: Type and schema checks

- **Purpose:** TypeScript (and OpenAPI/schema if used) must pass so contract and tests are reliable.
- **Commands (example):**
  - TypeScript: `npm run typecheck` or `tsc --noEmit`.
  - Optional: validate OpenAPI spec against API skeleton: `npx @apidevtools/swagger-cli validate openapi.yaml`.
- **Failure:** Pipeline fails.
- **Placeholder:**  
  `./scripts/ci-typecheck.sh` → `tsc --noEmit` for all packages/apps.

---

### Step 3: Database migrations

- **Purpose:** Apply migrations to a test/staging DB so schema is up to date before integration tests and deploy.
- **When:** After Validate; before integration tests. Use a dedicated test DB (e.g. CI PostgreSQL service or ephemeral container).
- **Commands (example):**
  - Prisma: `npx prisma migrate deploy` (or `prisma migrate dev` only locally).
  - Raw SQL: `psql $DATABASE_URL -f migrations/001_initial.sql` (or run migration runner script).
- **Env:** `DATABASE_URL` points to CI test database. Migrations are forward-only; no destructive changes without a dedicated down script.
- **Failure:** Pipeline fails; fix migration or DB state.
- **Placeholder:**  
  `./scripts/ci-migrate.sh` → set `DATABASE_URL` to CI DB, run `migrate deploy` or equivalent.

---

### Step 4: API contract verification (optional)

- **Purpose:** Ensure implemented API matches MVP API Skeleton (12): endpoints, methods, request/response shape.
- **Options:**
  - **A.** OpenAPI spec (e.g. `openapi.yaml`) generated from code or hand-maintained; CI runs `npm run test:contract` which starts server (or uses stub), runs requests against spec and checks responses.
  - **B.** Contract tests (e.g. Pact or custom) that call live endpoints and assert status + body shape against a shared contract file derived from doc 12.
- **Commands (example):**
  - `npm run test:contract` or `npx jest --testPathPattern=contract`.
- **Failure:** Pipeline fails; update implementation or contract to align with 12-MVP-API-SKELETON.md.
- **Placeholder:**  
  `./scripts/ci-contract.sh` → start API on test port, run contract test suite, exit with 0/1.

---

### Step 5: Unit tests

- **Purpose:** Fast feedback on domain and service logic without full DB/API.
- **Commands (example):** `npm run test` or `npm run test:unit` (e.g. Jest, Vitest). Exclude integration tests (slower).
- **Failure:** Pipeline fails.
- **Placeholder:**  
  `npm run test -- --testPathIgnorePatterns=integration`.

---

### Step 6: Integration tests

- **Purpose:** Run scenarios from Integration Test Plan (14) against a real (or test) API and DB.
- **Prerequisites:** Migrations applied to test DB; optional: seed minimal data (see Part 2) or fixtures per test.
- **Commands (example):**
  - Start API + DB (e.g. Docker Compose or CI services), wait for health.
  - Run: `npm run test:integration` or `npx jest --testPathPattern=integration --runInBand`.
  - Tests call `POST /v1/auth/login`, `POST /v1/buyer/orders`, etc., and assert status + body and optionally events.
- **Env:** `API_BASE_URL`, `DATABASE_URL`, optional `EVENT_BUS_URL` or test double.
- **Failure:** Pipeline fails; fix implementation or test.
- **Placeholder:**  
  `./scripts/ci-integration.sh` → start dependencies → run integration test suite → tear down.

---

### Step 7: Build

- **Purpose:** Produce deployable artifact (e.g. Docker image or Node build).
- **Commands (example):**
  - Backend: `docker build -t $IMAGE_TAG ./apps/api` or `npm run build` in api package.
  - Optional: push image to registry only on main (or on tag).
- **Artifacts:** Docker image tagged with commit SHA or tag; optional tarball for non-Docker deploy.
- **Failure:** Pipeline fails.
- **Placeholder:**  
  `docker build -t b2b-api:$CI_COMMIT_SHA -f apps/api/Dockerfile .`

---

### Step 8: Deploy staging

- **Purpose:** Deploy latest build to staging for QA and smoke tests.
- **When:** On push to main (or manual). Use same migrations and env as production but staging config (DB, secrets, feature flags).
- **Commands (example):**
  - `kubectl set image deployment/b2b-api api=$IMAGE_TAG` or platform CLI (e.g. `railway up`, `vercel deploy --prod` for frontend).
  - Run migrations against staging DB: `migrate deploy` with `DATABASE_URL=staging`.
- **Health check:** After deploy, `GET /health` or `GET /v1/auth/me` with a test token; expect 200. Fail deploy step if unhealthy.
- **Failure:** Mark deploy failed; do not update production. Trigger alert; consider auto-rollback (see 1.5).

---

### Step 9: Deploy production

- **Purpose:** Deploy to production only after explicit approval or tagged release.
- **When:** Manual trigger or on tag (e.g. `v1.0.0`). Use production DB URL and secrets.
- **Steps:** Run migrations (if any) → deploy artifact → run health check. Optionally run smoke tests against production (read-only).
- **Placeholder:**  
  Manual: "Deploy production" job uses same image as last successful staging (or tag). Runs `migrate deploy` then updates production deployment.

---

## 1.4 Rollback strategy

| Situation                                  | Action                                                                                                                                                                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Staging deploy fails (health check)**    | Do not promote to production. Fix and re-run pipeline. Optionally: revert staging to previous image.                                                                                                                                                       |
| **Production deploy fails (health check)** | Revert to previous known-good image/version. Re-run health check. If DB migration was applied, decide: (1) roll forward with a fix, or (2) run down-migration if available and revert app. Prefer roll-forward for MVP; avoid destructive down-migrations. |
| **Production incident after deploy**       | Rollback to previous image. If migration already ran, keep DB as-is and ensure app version is compatible (e.g. new columns nullable or backfill run separately).                                                                                           |
| **Rollback command (example)**             | `kubectl rollout undo deployment/b2b-api` or redeploy previous image tag from registry.                                                                                                                                                                    |

**Rule:** Migrations are additive (new columns, new tables). Avoid "drop column" or "drop table" in the same release as app change; do schema change in a prior release with backward-compatible app.

---

## 1.5 Pipeline file reference (placeholder)

Example layout for a single backend + optional frontend. Adjust to your repo.

```
.github/workflows/ci.yml          # or .gitlab-ci.yml, Jenkinsfile, etc.
scripts/
  ci-lint.sh
  ci-typecheck.sh
  ci-migrate.sh
  ci-contract.sh
  ci-integration.sh
apps/
  api/
    Dockerfile
migrations/                        # or prisma/migrations
  001_initial.sql
```

**Example GitHub Actions snippet (conceptual):**

```yaml
# Example: validate and test on PR
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck
  test:
    needs: validate
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd "pg_isready"
          --health-interval 10s
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run migrate
      - run: npm run test:integration
  build:
    needs: test
    steps:
      - run: docker build -t ${{ env.IMAGE_TAG }} -f apps/api/Dockerfile .
```

---

# Part 2: DB Seeding Strategy

## 2.1 Goals

- **Idempotent:** Safe to run multiple times; use fixed UUIDs and `ON CONFLICT` or "insert only if not exists".
- **Minimal:** One BusinessOwner, one ProviderOwner, one PlatformAdmin; one business with one location; one provider with a small catalog; one order with lines; one invoice and one payment.
- **Consistent:** All FKs, unique constraints, and check constraints satisfied. Ownership and roles match Permission Model (08).

---

## 2.2 Seed data summary

| Entity         | Count | Purpose                                                                                              |
| -------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| users          | 3     | buyer@mvp.local (BusinessOwner), provider@mvp.local (ProviderOwner), admin@mvp.local (PlatformAdmin) |
| businesses     | 1     | "MVP Test Restaurant"                                                                                |
| providers      | 1     | "MVP Test Wholesaler"                                                                                |
| business_users | 1     | buyer user → business_owner                                                                          |
| provider_users | 1     | provider user → provider_owner                                                                       |
| platform_users | 1     | admin user → platform_admin (if table exists)                                                        |
| locations      | 1     | Delivery address for business                                                                        |
| products       | 3     | Same provider; different categories                                                                  |
| orders         | 1     | status = delivered (so invoice and rating are valid)                                                 |
| order_lines    | 2     | Two products, quantities and totals set                                                              |
| deliveries     | 1     | status = delivered                                                                                   |
| invoices       | 1     | status = paid, linked to order                                                                       |
| invoice_lines  | 2     | Match order lines                                                                                    |
| payments       | 1     | status = completed, linked to invoice                                                                |
| ratings        | 1     | order rated 5 by buyer                                                                               |

---

## 2.3 Fixed UUIDs (for idempotency)

Use fixed UUIDs so re-runs do not create duplicates when using `ON CONFLICT (id) DO NOTHING` or equivalent.

| Entity        | ID (example)                           |
| ------------- | -------------------------------------- |
| buyer user    | `a0000001-0000-4000-8000-000000000001` |
| provider user | `a0000002-0000-4000-8000-000000000002` |
| admin user    | `a0000003-0000-4000-8000-000000000003` |
| business      | `b0000001-0000-4000-8000-000000000001` |
| provider      | `p0000001-0000-4000-8000-000000000001` |
| location      | `l0000001-0000-4000-8000-000000000001` |
| product 1     | `f0000001-0000-4000-8000-000000000001` |
| product 2     | `f0000002-0000-4000-8000-000000000002` |
| product 3     | `f0000003-0000-4000-8000-000000000003` |
| order         | `o0000001-0000-4000-8000-000000000001` |
| delivery      | `d0000001-0000-4000-8000-000000000001` |
| invoice       | `i0000001-0000-4000-8000-000000000001` |
| payment       | `y0000001-0000-4000-8000-000000000001` |
| rating        | `r0000001-0000-4000-8000-000000000001` |

---

## 2.4 Idempotency approach

- **users:** `INSERT ... ON CONFLICT (email) DO NOTHING` (or `ON CONFLICT (id) DO NOTHING` if using fixed id).
- **businesses, providers:** `INSERT ... ON CONFLICT (id) DO NOTHING` with fixed UUIDs.
- **business_users, provider_users:** `INSERT ... ON CONFLICT (user_id, business_id)` / `(user_id, provider_id) DO NOTHING`.
- **locations:** `INSERT ... ON CONFLICT (id) DO NOTHING`.
- **products:** `INSERT ... ON CONFLICT (provider_id, sku) DO NOTHING`.
- **orders, order_lines, deliveries, invoices, invoice_lines, payments, ratings:** Insert with fixed IDs; use `ON CONFLICT (id) DO NOTHING` so second run does not fail. Alternatively, delete seed data at start of seed script (e.g. delete in reverse FK order) then insert; that is not idempotent for concurrent runs but is simple for local/dev.

Recommended for MVP: use fixed UUIDs and `ON CONFLICT (id) DO NOTHING` (or equivalent) for all seed rows so the script is fully idempotent.

---

## 2.5 Platform admin role

Schema (13) does not define a `platform_users` table; Admin Service owns "PlatformUser" (09). Two options:

- **A. Table:** Add `platform_users (user_id UUID REFERENCES users(id), role VARCHAR(30), UNIQUE(user_id))` and seed one row for the admin user with role `platform_admin`.
- **B. Config:** Treat admin as configured list (e.g. env `PLATFORM_ADMIN_EMAILS=admin@mvp.local`); app resolves admin by email. No seed table.

If using A, include the CREATE TABLE in a migration and the insert in the seed script below. Seed script below assumes option A with a table named `platform_users`; if absent, skip that insert and use option B.

---

## 2.6 Seed script (PostgreSQL)

Run after migrations. Uses fixed UUIDs and `ON CONFLICT DO NOTHING` where applicable. Password hashes are placeholders; replace with real bcrypt/argon2 hashes for any env that accepts login.

```sql
-- =============================================================================
-- MVP Seed Data (idempotent)
-- =============================================================================
-- Run after migrations. Safe to run multiple times.
-- Replace password_hash with real hashes for environments that need login.

BEGIN;

-- 1. Users (Identity Service)
INSERT INTO users (id, email, password_hash, first_name, last_name, status)
VALUES
  ('a0000001-0000-4000-8000-000000000001', 'buyer@mvp.local',   '$2a$10$placeholder.buyer',   'Buyer',   'MVP', 'active'),
  ('a0000002-0000-4000-8000-000000000002', 'provider@mvp.local', '$2a$10$placeholder.provider', 'Provider', 'MVP', 'active'),
  ('a0000003-0000-4000-8000-000000000003', 'admin@mvp.local',    '$2a$10$placeholder.admin',    'Admin',   'MVP', 'active')
ON CONFLICT (email) DO UPDATE SET
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
VALUES ('p0000001-0000-4000-8000-000000000001', 'MVP Test Wholesaler Ltd', 'MVP Test Wholesaler', 'food_wholesaler', 'active', 'GBP')
ON CONFLICT (id) DO NOTHING;

-- 4. Business user membership (Identity Service)
INSERT INTO business_users (user_id, business_id, role)
VALUES ('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'business_owner')
ON CONFLICT (user_id, business_id) DO NOTHING;

-- 5. Provider user membership (Identity Service)
INSERT INTO provider_users (user_id, provider_id, role)
VALUES ('a0000002-0000-4000-8000-000000000002', 'p0000001-0000-4000-8000-000000000001', 'provider_owner')
ON CONFLICT (user_id, provider_id) DO NOTHING;

-- 6. Platform admin (optional: only if platform_users table exists)
-- INSERT INTO platform_users (user_id, role)
-- VALUES ('a0000003-0000-4000-8000-000000000003', 'platform_admin')
-- ON CONFLICT (user_id) DO NOTHING;

-- 7. Location (Business Service: delivery address)
INSERT INTO locations (id, address_line_1, city, region, postal_code, country, location_type, owner_type, owner_id, is_default)
VALUES ('l0000001-0000-4000-8000-000000000001', '1 High Street', 'London', 'Greater London', 'SW1A 1AA', 'GB', 'delivery_address', 'business', 'b0000001-0000-4000-8000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

UPDATE businesses
SET default_delivery_address_id = 'l0000001-0000-4000-8000-000000000001', updated_at = now()
WHERE id = 'b0000001-0000-4000-8000-000000000001';

-- 8. Products (Provider Service)
INSERT INTO products (id, provider_id, sku, name, category, unit, price, currency, tax_rate, is_active)
VALUES
  ('f0000001-0000-4000-8000-000000000001', 'p0000001-0000-4000-8000-000000000001', 'SKU001', 'Organic Tomatoes 1kg', 'fresh_produce', 'kg', 4.50, 'GBP', 0.00, true),
  ('f0000002-0000-4000-8000-000000000002', 'p0000001-0000-4000-8000-000000000001', 'SKU002', 'Olive Oil 5L', 'dry_goods', 'unit', 28.00, 'GBP', 0.20, true),
  ('f0000003-0000-4000-8000-000000000003', 'p0000001-0000-4000-8000-000000000001', 'SKU003', 'Pasta 1kg', 'dry_goods', 'unit', 2.20, 'GBP', 0.20, true)
ON CONFLICT (provider_id, sku) DO NOTHING;

-- 9. Order (Order Service) – status delivered so invoice/rating valid
INSERT INTO orders (
  id, order_number, business_id, provider_id, delivery_location_id,
  status, subtotal, tax_total, total, currency, requested_delivery_date,
  submitted_at, confirmed_at, delivered_at, created_at, updated_at
)
VALUES (
  'o0000001-0000-4000-8000-000000000001', 'ORD-MVP-00001',
  'b0000001-0000-4000-8000-000000000001', 'p0000001-0000-4000-8000-000000000001', 'l0000001-0000-4000-8000-000000000001',
  'delivered', 32.50, 3.04, 35.54, 'GBP', (CURRENT_DATE + 1),
  now() - interval '3 days', now() - interval '3 days', now() - interval '1 day', now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- 10. Order lines (Order Service) – snapshot of two products (explicit id for idempotency)
INSERT INTO order_lines (id, order_id, line_type, product_id, name, quantity, unit, unit_price, tax_rate, line_total)
VALUES
  ('e0000001-0000-4000-8000-000000000001', 'o0000001-0000-4000-8000-000000000001', 'product', 'f0000001-0000-4000-8000-000000000001', 'Organic Tomatoes 1kg', 2, 'kg', 4.50, 0.00, 9.00),
  ('e0000002-0000-4000-8000-000000000002', 'o0000001-0000-4000-8000-000000000001', 'product', 'f0000002-0000-4000-8000-000000000002', 'Olive Oil 5L', 1, 'unit', 28.00, 0.20, 33.60)
ON CONFLICT (id) DO NOTHING;

-- 11. Delivery (Logistics Service)
INSERT INTO deliveries (id, order_id, status, actual_delivery_at)
VALUES ('d0000001-0000-4000-8000-000000000001', 'o0000001-0000-4000-8000-000000000001', 'delivered', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- 12. Invoice (Payment Service)
INSERT INTO invoices (id, invoice_number, provider_id, business_id, status, subtotal, tax_total, total, currency, due_date, issued_at, paid_at)
VALUES (
  'i0000001-0000-4000-8000-000000000001', 'INV-MVP-00001',
  'p0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001',
  'paid', 32.50, 3.04, 35.54, 'GBP', CURRENT_DATE + 14, now() - interval '2 days', now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 13. Invoice lines (Payment Service)
INSERT INTO invoice_lines (id, invoice_id, order_id, description, quantity, unit_price, line_total)
VALUES
  ('g0000001-0000-4000-8000-000000000001', 'i0000001-0000-4000-8000-000000000001', 'o0000001-0000-4000-8000-000000000001', 'Organic Tomatoes 1kg x 2', 2, 4.50, 9.00),
  ('g0000002-0000-4000-8000-000000000002', 'i0000001-0000-4000-8000-000000000001', 'o0000001-0000-4000-8000-000000000001', 'Olive Oil 5L x 1', 1, 28.00, 33.60)
ON CONFLICT (id) DO NOTHING;

-- 14. Payment (Payment Service)
INSERT INTO payments (id, invoice_id, business_id, amount, currency, status, method, paid_at)
VALUES ('y0000001-0000-4000-8000-000000000001', 'i0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 35.54, 'GBP', 'completed', 'card', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- 15. Rating (Trust Service)
INSERT INTO ratings (id, order_id, business_id, provider_id, rating, is_visible)
VALUES ('r0000001-0000-4000-8000-000000000001', 'o0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'p0000001-0000-4000-8000-000000000001', 5, true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

**Note:** `users` table has unique on `email`, so `ON CONFLICT (email) DO UPDATE` is used to keep seed users in sync. Tables with only `id` as PK use `ON CONFLICT (id) DO NOTHING`; for `order_lines`, `invoice_lines` you need a primary key—if your schema uses `gen_random_uuid()` and no unique constraint on natural keys, use explicit ids as above and add `ON CONFLICT (id) DO NOTHING`. If a table has no unique constraint other than `id`, ensure the seed script inserts with fixed ids so the second run does not violate unique (e.g. order_number, invoice_number). The script uses fixed UUIDs for orders, invoices, payments, ratings, and lines so conflicts are on `id`.

**order_lines / invoice_lines:** Schema (13) does not define a unique constraint on (order_id, product_id) or similar; conflict is only on `id`. So use explicit UUIDs and `ON CONFLICT (id) DO NOTHING`. If your migration does not allow specifying id for order_lines/invoice_lines (e.g. id is always generated), then omit ON CONFLICT for those and delete before insert for idempotency (e.g. `DELETE FROM order_lines WHERE order_id = 'o0000001-...'` then insert).

---

## 2.7 Seed script usage

| Environment            | When to run                                             | Command (example)                                                 |
| ---------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| Local                  | After `migrate deploy` or first setup                   | `psql $DATABASE_URL -f scripts/seed-mvp.sql` or `npm run db:seed` |
| CI (integration tests) | After migrations; before integration tests              | Same; use CI test DB URL                                          |
| Staging                | Once per env or after DB reset                          | Same; use staging DB URL                                          |
| Production             | Do not run full seed; use migrations and app flows only | —                                                                 |

---

## 2.8 Verifying seed data

- **Ownership:** buyer user has business_users → business; provider user has provider_users → provider; admin has platform_users (if used). Business has one location (owner_type=business). Provider has products. Order has business_id, provider_id, delivery_location_id. Invoice has provider_id, business_id; payment has business_id, invoice_id.
- **Permissions:** BusinessOwner can access business and its orders/invoices; ProviderOwner can access provider and its orders/invoices; PlatformAdmin can access admin endpoints (list users, businesses, providers; update status).
- **Relations:** delivery.order_id = order.id; order_lines.order_id = order.id; invoice_lines.invoice_id = invoice.id; payment.invoice_id = invoice.id; rating.order_id = order.id. All FKs satisfied.
- **Constraints:** order_number and invoice_number unique; rating 1–5; status values within check constraints; currency GBP.

---

## 2.9 File layout (placeholder)

```
scripts/
  seed-mvp.sql          # Full seed script (Part 2.6)
  ci-lint.sh
  ci-typecheck.sh
  ci-migrate.sh
  ci-contract.sh
  ci-integration.sh
package.json            # "db:seed": "psql $DATABASE_URL -f scripts/seed-mvp.sql"
```

For `order_lines` and `invoice_lines`, if the schema uses `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and no unique key on (order_id, product_id), then to make seed idempotent either: (1) add explicit id column value in INSERT and use ON CONFLICT (id) DO NOTHING (requires knowing the ids from a previous run or fixed ids), or (2) delete by order_id/invoice_id then insert. The script above uses fixed UUIDs for all rows; ensure your migrations allow inserting explicit id values for order_lines and invoice_lines (no DEFAULT-only constraint that prevents override). If not, run a small cleanup before insert:

```sql
DELETE FROM ratings WHERE order_id = 'o0000001-0000-4000-8000-000000000001';
DELETE FROM payments WHERE invoice_id = 'i0000001-0000-4000-8000-000000000001';
DELETE FROM invoice_lines WHERE invoice_id = 'i0000001-0000-4000-8000-000000000001';
DELETE FROM invoices WHERE id = 'i0000001-0000-4000-8000-000000000001';
DELETE FROM deliveries WHERE order_id = 'o0000001-0000-4000-8000-000000000001';
DELETE FROM order_lines WHERE order_id = 'o0000001-0000-4000-8000-000000000001';
DELETE FROM orders WHERE id = 'o0000001-0000-4000-8000-000000000001';
```

Then insert. That makes the seed "replace seed data" idempotent (same outcome every run) but not safe for concurrent runs. For CI/local, the fixed-UUID + ON CONFLICT approach is preferred where the schema allows it.
