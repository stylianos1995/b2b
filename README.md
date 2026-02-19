# B2B Hospitality Marketplace

A two-sided marketplace connecting **hospitality businesses (buyers)** with **suppliers and providers**. Buyers discover providers, place orders, and pay invoices; providers manage their catalog, fulfill orders, and issue invoices.

---

## What this app does

- **Buyers** (restaurants, cafés, hotels, etc.):
  - Register and add their business and delivery addresses.
  - Discover providers by **type** (e.g. food wholesaler, bakery) and **location** (postcode).
  - Browse provider catalogs, add items to cart, and place orders with a requested delivery date.
  - Track orders (cancel if still in draft/submitted), view and **pay invoices** via Stripe Checkout, and download invoice PDFs.

- **Providers** (suppliers, wholesalers, producers):
  - Register and create a provider profile with address.
  - Add products (name, price, unit, category, etc.).
  - Receive orders, **confirm or reject** them, then manage delivery: mark as preparing → **dispatched** (shipped) → delivered.
  - **Filter orders** by status and date (default: last 7 days).
  - Create invoices after delivery; buyers pay via Stripe.

- **Platform**: JWT-based auth, role-based access (business_owner, provider_owner, etc.), PostgreSQL persistence, and optional Stripe webhooks so invoices are marked paid automatically.

---

## Tech stack

| Layer      | Technology |
| ---------- | ---------- |
| Backend    | **NestJS** (Node.js), TypeScript, TypeORM, PostgreSQL, JWT, Stripe, PDFKit (invoice PDFs) |
| Frontend   | **React 19**, **Vite**, TypeScript, React Router |
| Database   | **PostgreSQL 15+** |
| Payments   | **Stripe** (Checkout for invoices) |

The API runs on port **3000**; the frontend dev server on **5173** and proxies `/v1` to the API.

---

## Prerequisites

- **Node.js** (LTS) from [nodejs.org](https://nodejs.org)
- **PostgreSQL 15+** (local install or Docker)
- (Optional) **Stripe** test account for payments — see [docs/PAYMENT-TESTING.md](docs/PAYMENT-TESTING.md)

---

## Quick start

### 1. Clone and install

```bash
cd B2B
npm install
cd frontend && npm install && cd ..
```

### 2. Database

Create a PostgreSQL database (e.g. `b2b_mvp`). With Docker:

```bash
docker run -d --name b2b-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=b2b_mvp -p 5432:5432 postgres:15
```

### 3. Environment

Copy the example env and set at least `DATABASE_URL` and `JWT_SECRET`:

```bash
# Windows (PowerShell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edit **.env**:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/b2b_mvp
JWT_SECRET=your-jwt-secret-change-in-production
FRONTEND_URL=http://localhost:5173
```

For **Stripe** (payments): add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (and optionally `STRIPE_PUBLIC_KEY`). See [docs/PAYMENT-TESTING.md](docs/PAYMENT-TESTING.md).

### 4. Migrations and seed

```bash
npm run migrate
```

Then seed data (choose one):

- **From the test page:** Start the API (step 5), open **test-api.html** in the browser, click **1. Run seed**, then **2. Fix seed passwords**.
- **From command line** (if you have `psql`):
  ```bash
  # PowerShell
  $env:DATABASE_URL = (Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' }) -replace '^DATABASE_URL=',''
  psql $env:DATABASE_URL -f src/seeds/seed-mvp.sql

  # Then fix passwords (Node)
  npm run seed:fix-passwords
  ```

### 5. Run the app

**Terminal 1 – API:**

```bash
npm run start:dev
```

**Terminal 2 – Frontend:**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**.

### 6. Log in

Use the test page (**test-api.html**) or the frontend login:

- **Buyer:** `buyer@mvp.local` / `password`
- **Provider:** `provider@mvp.local` / `password`

(Other seed users are in `src/seeds/seed-mvp.sql`.)

---

## Environment variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/b2b_mvp`) |
| `JWT_SECRET` | Yes | Secret for signing JWTs (use a long random string in production) |
| `PORT` | No | API port (default `3000`) |
| `FRONTEND_URL` | No | Frontend origin for Stripe redirects (default `http://localhost:5173`) |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key (test: `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | For payments | Webhook signing secret (`whsec_...`) for marking invoices paid |
| `STRIPE_PUBLIC_KEY` | No | Only if using Stripe.js in frontend |
| `JWT_EXPIRES_IN` | No | JWT expiry (default `15m`) |

See **.env.example** for the full list.

---

## How to operate the app

### Buyer flow

1. Log in as a buyer → **Dashboard**.
2. **My Business:** Add company details and at least one **delivery address**.
3. **Discover:** Filter by provider type and/or postcode; open a provider → **View catalog & order**.
4. In the catalog: choose delivery address, delivery date, add items, **Place order**.
5. **My Orders:** Track status; **Cancel** if still submitted.
6. **My Invoices:** Open an invoice → **Pay** (Stripe Checkout) or **Download PDF**.

### Provider flow

1. Log in as a provider → **Dashboard**.
2. **Profile:** Create/update provider and address.
3. **Products:** Add products (name, SKU, price, unit, category).
4. **Orders:** Use filters (status, date range — default last 7 days). Open an order → **Confirm** or **Reject**.
5. For confirmed orders: **Mark preparing** → **Mark dispatched** (sets order to shipped and delivery to in transit) → **Mark delivered**.
6. After delivery: **Create invoice**. Buyer pays; optional **Download PDF** from **Invoices**.

### Test page

**test-api.html** in the project root lets you run seed, fix passwords, and log in via the API without the frontend (useful for quick checks).

---

## Project structure

```
B2B/
├── src/                    # NestJS backend
│   ├── main.ts
│   ├── auth/               # JWT, guards, strategies
│   ├── config/              # TypeORM, env
│   ├── entities/            # User, Business, Provider, Order, Invoice, etc.
│   ├── modules/             # order, payment, discovery, delivery, business, provider, admin
│   ├── migrations/
│   └── seeds/               # seed-mvp.sql
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── api/             # API client (auth, orders, discovery, invoices, delivery)
│   │   ├── components/      # Layout, DashboardLayout, Footer
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # buyer/*, provider/*, Login, Register, Settings
│   │   └── types/
│   └── vite.config.ts       # proxy /v1 → localhost:3000
├── docs/                    # Architecture, flows, payment testing
├── test-api.html            # Quick API/login test page
├── .env.example
├── SETUP.md                 # Short setup guide
└── README.md                # This file
```

---

## Pushing to GitHub

### 1. Ensure sensitive files are ignored

Create a **.gitignore** in the project root if you don’t have one. It should include at least:

```gitignore
# Dependencies
node_modules/
frontend/node_modules/

# Environment (never commit secrets)
.env
.env.local
.env.*.local

# Build output
dist/
frontend/dist/

# Logs and OS
*.log
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
```

Do **not** commit `.env` (it contains `DATABASE_URL`, `JWT_SECRET`, and possibly Stripe keys). Only commit `.env.example` (with placeholder values).

### 2. Initialize Git (if needed) and add remote

```bash
git init
git add .
git status   # confirm .env is not listed
git commit -m "Initial commit: B2B Marketplace MVP"
```

Create a **new repository** on GitHub (do not add a README or .gitignore there if you already have them locally). Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 3. Collaborators and CI

- Add collaborators in GitHub: **Settings → Collaborators**.
- For CI (e.g. lint, test, build), use **GitHub Actions** and store secrets (e.g. `DATABASE_URL`, `JWT_SECRET`) in **Settings → Secrets and variables → Actions**. Never put real secrets in the repo.

### 4. After clone (other machines or teammates)

They should:

1. Clone the repo.
2. Run `npm install` (and `npm install` in `frontend/`).
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, etc.
4. Run `npm run migrate`, then seed (see Quick start).
5. Start API and frontend as in **Run the app** above.

---

## Scripts reference

| Command | Description |
| ------- | ----------- |
| `npm run start:dev` | Start API in watch mode (port 3000) |
| `npm run start:prod` | Start API production build (`node dist/main`) |
| `npm run build` | Build API (`dist/`) |
| `npm run migrate` | Run TypeORM migrations |
| `npm run migrate:revert` | Revert last migration |
| `npm run seed` | Run seed SQL (requires `psql` and `DATABASE_URL`) |
| `npm run seed:fix-passwords` | Set seed user passwords to `password` (Node script) |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests (see test docs for Stripe/env) |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |

**Frontend** (from `frontend/`):

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Build for production (`dist/`) |
| `npm run preview` | Serve production build locally |

---

## Further documentation

- **[SETUP.md](SETUP.md)** — Short setup and seed steps.
- **[docs/PAYMENT-TESTING.md](docs/PAYMENT-TESTING.md)** — Stripe test keys, webhooks, and test cards.
- **[docs/](docs/)** — System design, user flows, architecture, DB schema, and MVP feature map.

---

## License

Private or per your organization’s policy.
#   b 2 b  
 