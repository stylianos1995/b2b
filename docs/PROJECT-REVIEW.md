# B2B MVP – Full project review

A concise review of what has been built so far on the B2B Hospitality Marketplace backend and frontend.

---

## 1. Project overview

- **Goal:** MVP for a two-sided B2B marketplace (buyers = businesses, providers = suppliers).
- **Backend:** NestJS + TypeScript, PostgreSQL, JWT auth, event-driven notifications.
- **Frontend:** React + Vite + TypeScript SPA (buyer and provider flows).
- **Docs:** `docs/` holds architecture, entities, API, roadmap (phases 1–4 and beyond).

---

## 2. Backend – what’s implemented

### 2.1 Foundation (Phase 1–2)

| Area            | Status | Notes                                                                                                                                                                                             |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NestJS skeleton | ✅     | Global prefix `v1`, validation pipe, CORS, exception filter                                                                                                                                       |
| Config          | ✅     | `ConfigModule`, `.env` / `.env.example`, database and app config                                                                                                                                  |
| TypeORM         | ✅     | PostgreSQL, one initial migration, retry/connection timeout                                                                                                                                       |
| Entities        | ✅     | 17 entities: User, Session, Business, BusinessUser, Provider, ProviderUser, Location, Product, Availability, Order, OrderLine, Delivery, Invoice, InvoiceLine, Payment, Rating, PreferredSupplier |
| Migrations      | ✅     | `npm run migrate`, single initial schema migration                                                                                                                                                |
| Seed            | ✅     | Idempotent SQL seed (`src/seeds/seed-mvp.sql`), valid UUIDs, real bcrypt for `password`                                                                                                           |

### 2.2 Auth (Phase 2)

| Feature                 | Endpoint / behaviour                           |
| ----------------------- | ---------------------------------------------- |
| Register                | `POST /v1/auth/register`                       |
| Login                   | `POST /v1/auth/login` → access + refresh token |
| Refresh                 | `POST /v1/auth/refresh`                        |
| Logout                  | `POST /v1/auth/logout`                         |
| Me                      | `GET /v1/auth/me` (JWT)                        |
| Dev: run seed           | `POST /v1/auth/dev/run-seed`                   |
| Dev: fix seed passwords | `POST /v1/auth/dev/fix-seed-passwords`         |

- JWT access (15m) + refresh (7d), stored sessions with hashed refresh token.
- Guards: `JwtAuthGuard` (global), `RolesGuard`, `BusinessScopeGuard`, `ProviderScopeGuard`.
- Principal resolved from JWT; memberships (business/provider) attached to request.
- Seed users: `buyer@mvp.local`, `provider@mvp.local`, `admin@mvp.local` (password: `password`). Dev-only fallback allows login with literal `password` for these when DB hash is wrong.

### 2.3 Business module (Phase 3a)

| Feature         | Endpoint                                                                  |
| --------------- | ------------------------------------------------------------------------- |
| Create business | `POST /v1/businesses` (creates business + first location + business_user) |
| Get business    | `GET /v1/businesses/:id`                                                  |
| Update business | `PATCH /v1/businesses/:id`                                                |
| Add location    | `POST /v1/businesses/:id/locations`                                       |
| List locations  | `GET /v1/businesses/:id/locations`                                        |

### 2.4 Provider module (Phase 3a)

| Feature               | Endpoint                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Create provider       | `POST /v1/providers` (with address, creates provider_user)                                                         |
| Get / update provider | `GET /v1/providers/:id`, `PATCH /v1/providers/:id`                                                                 |
| Products              | `POST /v1/providers/:id/products`, `GET /v1/providers/:id/products`, `PATCH /v1/providers/:id/products/:productId` |
| Provider locations    | `POST /v1/providers/:id/locations`, `GET /v1/providers/:id/locations`                                              |

### 2.5 Discovery (Phase 3b)

| Feature           | Endpoint                                                                            |
| ----------------- | ----------------------------------------------------------------------------------- |
| List providers    | `GET /v1/discovery/providers` (buyer only; optional postcode, category, pagination) |
| Provider public   | `GET /v1/discovery/providers/:id`                                                   |
| Provider products | `GET /v1/discovery/providers/:id/products`                                          |

### 2.6 Order module (Phase 3c)

| Role     | Endpoints                                                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buyer    | `POST /v1/buyer/orders` (place order; idempotency key supported), `GET /v1/buyer/orders`, `GET /v1/buyer/orders/:id`, `POST /v1/buyer/orders/:id/cancel`                          |
| Provider | `GET /v1/provider/orders`, `GET /v1/provider/orders/:id`, `POST /v1/provider/orders/:id/confirm`, `POST /v1/provider/orders/:id/reject`, `PATCH /v1/provider/orders/:id` (status) |

- Place order: `provider_id`, `delivery_location_id`, `requested_delivery_date`, `lines[]` (product_id, quantity).
- On confirm, a delivery record is created and linked to the order.

### 2.7 Delivery module (Phase 3d)

| Feature         | Endpoint                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Get delivery    | `GET /v1/deliveries/:id`                                                                       |
| Update delivery | `PATCH /v1/deliveries/:id` (e.g. status → delivered; sets `order.delivered_at` when delivered) |

### 2.8 Invoice & payment (Phase 3e)

| Feature           | Endpoint                                                            |
| ----------------- | ------------------------------------------------------------------- |
| Create invoice    | `POST /v1/invoices` (body: `order_id`) – provider                   |
| Get invoice       | `GET /v1/invoices/:id`                                              |
| Buyer invoices    | `GET /v1/buyer/invoices`                                            |
| Provider invoices | `GET /v1/provider/invoices`                                         |
| Pay invoice       | `POST /v1/invoices/:invoiceId/payments` (idempotency key supported) |
| List payments     | `GET /v1/payments`                                                  |

- One invoice per order; payment marks invoice as paid.

### 2.9 Trust – ratings (Phase 3f)

| Feature       | Endpoint                                                                          |
| ------------- | --------------------------------------------------------------------------------- |
| Submit rating | `POST /v1/orders/:id/ratings` (buyer; one rating per order, for delivered orders) |

### 2.10 Admin (Phase 3g)

| Feature    | Endpoint                                                     |
| ---------- | ------------------------------------------------------------ |
| Users      | `GET /v1/admin/users`, `PATCH /v1/admin/users/:id`           |
| Businesses | `GET /v1/admin/businesses`, `PATCH /v1/admin/businesses/:id` |
| Providers  | `GET /v1/admin/providers`, `PATCH /v1/admin/providers/:id`   |
| Payouts    | `POST /v1/admin/payouts` (stubbed)                           |

- Admin access via `PLATFORM_ADMIN_EMAILS` (comma-separated emails); JWT strategy adds platform_admin for those users.

### 2.11 Health & config

- `GET /v1/health` for liveness.
- Database: retry (e.g. 3 attempts, delay, timeout) for startup.

### 2.12 Event-driven & notifications (Phase 4)

| Component             | Purpose                                                                              |
| --------------------- | ------------------------------------------------------------------------------------ |
| Event bus             | `@nestjs/event-emitter`; `EventBusService` (emit / emitAsync)                        |
| Event names & types   | Centralised in `src/events/`                                                         |
| Producers             | Auth, Business, Provider, Order, Delivery, Payment, Trust – emit after state changes |
| Notification consumer | Listens to events, calls `NotificationService`                                       |
| Notification service  | Email sending (SendGrid); without `SENDGRID_API_KEY` only logs                       |

### 2.13 Idempotency (Phase 4)

- In-memory idempotency store (e.g. 24h TTL).
- Used for: `POST /v1/buyer/orders` (place order), `POST /v1/invoices/:id/payments`.

### 2.14 Tests & CI (Phase 4)

- **Unit:** Jest, exclude integration.
- **Integration:** `tests/integration/`, Jest config, setup; example auth integration spec; helpers (e.g. login, bearer).
- **Scripts:** `test:unit`, `test:integration`, `ci:validate`, `ci:test`, lint/format scope.
- **CI:** `.github/workflows/ci-full.yml` – validate, build, run tests with PostgreSQL service and migrations.

---

## 3. Seed & login fixes (done along the way)

- **Seed SQL:** Placeholder password hashes replaced with a real bcrypt hash for `password`; UUIDs made valid (hex-only) so PostgreSQL accepts them.
- **Seed execution:** Seed service runs statements one-by-one in a transaction so the first failing statement surfaces; Nest assets copy `seeds/**/*.sql` into `dist`.
- **Seed from API:** `POST /v1/auth/dev/run-seed` runs the full seed without psql.
- **Password fix:** `POST /v1/auth/dev/fix-seed-passwords` sets seed users’ password to `password`; `npm run seed:fix-passwords` script does the same via Node.
- **Login:** DTO trims email/password; dev-only logic allows seed users to log in with literal `password` when the stored hash is wrong and then fixes the hash.
- **CORS:** Enabled in `main.ts` so browser clients (e.g. `test-api.html`) can call the API.

---

## 4. Frontend – what’s implemented (Step 1)

- **Stack:** React 19, Vite 7, TypeScript, React Router 7.
- **Location:** `frontend/`; dev server proxies `/v1` → `http://localhost:3000`.

### 4.1 Auth & API

- **AuthContext:** Login, logout, token in `localStorage`, `getMe()`, `refreshUser()`; exposes `user`, `businessId`, `providerId`, `isBuyer`, `isProvider`.
- **API client:** `api()`, `apiGet`, `apiPost`, `apiPatch` with `Authorization: Bearer` when token exists.
- **Modules:** `api/auth`, `api/business`, `api/discovery`, `api/orders`, `api/provider`, `api/invoices`, `api/delivery` + shared `api/client` and `types`.

### 4.2 Buyer flow

- **Login / Register** – Public pages; after login, redirect by role.
- **My business** – Create business (with address); list and add delivery addresses.
- **Discover** – List providers (from discovery API).
- **Provider catalog** – Products, add to cart, choose delivery address and date, place order.
- **My orders** – List buyer orders; cancel when allowed.

### 4.3 Provider flow

- **Profile** – Create provider (with address); update legal/trading name and type.
- **Products** – List products; add product (SKU, name, category, unit, price, currency).
- **Orders** – List provider orders; open order detail.
- **Order detail** – Confirm / reject; update order status; update delivery status (e.g. dispatched, delivered); create invoice when delivered.
- **Invoices** – List provider invoices.

### 4.4 Layout & routing

- **Layout:** Top nav (links by buyer vs provider), outlet for child routes.
- **Routes:** `/`, `/login`, `/register`; `/buyer/*` (dashboard, business, discover, providers/:id, orders); `/provider/*` (dashboard, profile, products, orders, orders/:id, invoices).
- **Guards:** Require auth; redirect to `/buyer/business` or `/provider/profile` when user has no business/provider.

---

## 5. Scripts & setup

**Backend (root)**

- `npm run start:dev` – API with watch.
- `npm run migrate` – Run migrations.
- `npm run seed` – Seed via psql (if available).
- `npm run seed:fix-passwords` – Fix seed user passwords via Node.
- `npm run test:unit`, `npm run test:integration`, `npm run ci:validate`, `npm run ci:test`.

**Frontend (`frontend/`)**

- `npm run dev` – Vite dev server (e.g. http://localhost:5173).
- `npm run build`, `npm run preview`.

**Setup**

- **SETUP.md** – PostgreSQL, `.env`, migrate, seed (including Run seed / Fix seed passwords), optional frontend.
- **frontend/README.md** – How to run the frontend and what the flows do.

---

## 6. What’s not done yet (from your roadmap)

- **Real email** – SendGrid (or similar) wired and used in production (env key).
- **Forgot / reset password** – Endpoints exist but throw “not implemented”.
- **Deploy** – Staging/production, DB backups, env-based config.
- **E2E** – Full flow test (buyer order → provider confirm → deliver → invoice → pay) without manual DB edits.
- **Optional:** Buyer order detail page; provider product edit/disable in UI. Stripe Checkout and buyer My Invoices + Pay are implemented.

---

## 7. Quick reference

| You want to…          | Do this                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Run API               | `npm run start:dev` (root), ensure PostgreSQL + `DATABASE_URL`                                                                                 |
| Run frontend          | `cd frontend && npm run dev`, open http://localhost:5173                                                                                       |
| Reset DB data         | Run seed: from UI “Run seed” or `npm run seed` / `psql … -f src/seeds/seed-mvp.sql`; then “Fix seed passwords” or `npm run seed:fix-passwords` |
| Log in as buyer       | `buyer@mvp.local` / `password`                                                                                                                 |
| Log in as provider    | `provider@mvp.local` / `password`                                                                                                              |
| Test API from browser | Use `test-api.html` (Run seed → Fix seed passwords → Login) or the React app                                                                   |

---

This is the full review of what’s in place today; you can use it as a single reference for “what we did so far.”
