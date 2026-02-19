# B2B Hospitality Marketplace

A two-sided marketplace connecting **hospitality businesses (buyers)** with **suppliers and providers**. Buyers discover providers, place orders, and pay invoices; providers manage their catalog, fulfill orders, and issue invoices.

---

## What this app does

**Buyers** (restaurants, cafés, hotels):

- Register and add their business and delivery addresses
- Discover providers by **type** (e.g. food wholesaler, bakery) and **location** (postcode)
- Browse catalogs, add items to cart, place orders with a requested delivery date
- Track orders (cancel if still submitted), view and **pay invoices** via Stripe Checkout, download invoice PDFs

**Providers** (suppliers, wholesalers, producers):

- Register and create a provider profile with address
- Add products (name, price, unit, category)
- Receive orders, **confirm or reject**, then manage delivery: preparing → **dispatched** → delivered
- **Filter orders** by status and date (default: last 7 days)
- Create invoices after delivery; buyers pay via Stripe

**Platform:** JWT auth, role-based access, PostgreSQL, optional Stripe webhooks for automatic invoice status updates.

---

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Backend  | NestJS, TypeScript, TypeORM, PostgreSQL, JWT, Stripe, PDFKit |
| Frontend | React 19, Vite, TypeScript, React Router |
| Database | PostgreSQL 15+ |
| Payments | Stripe (Checkout for invoices) |

API: port **3000**. Frontend: port **5173** (proxies `/v1` to the API).

---

## Prerequisites

- **Node.js** (LTS) from [nodejs.org](https://nodejs.org)
- **PostgreSQL 15+** (local or Docker)
- Optional: **Stripe** test account — see [docs/PAYMENT-TESTING.md](docs/PAYMENT-TESTING.md)

---

## Quick start

### 1. Clone and install

```bash
cd b2b
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

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/b2b_mvp
JWT_SECRET=your-jwt-secret-change-in-production
FRONTEND_URL=http://localhost:5173
```

For payments, add Stripe keys. See [docs/PAYMENT-TESTING.md](docs/PAYMENT-TESTING.md).

### 4. Migrations and seed

```bash
npm run migrate
```

Seed data:

- **Test page:** Start the API (step 5), open `test-api.html`, click **1. Run seed**, then **2. Fix seed passwords**
- **Command line** (if you have `psql`):

  ```bash
  psql $env:DATABASE_URL -f src/seeds/seed-mvp.sql
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

- **Buyer:** `buyer@mvp.local` / `password`
- **Provider:** `provider@mvp.local` / `password`

---

## Environment variables

| Variable              | Required | Description                    |
| --------------------- | -------- | ------------------------------ |
| `DATABASE_URL`        | Yes      | PostgreSQL connection string   |
| `JWT_SECRET`          | Yes      | Secret for signing JWTs       |
| `PORT`                | No       | API port (default `3000`)     |
| `FRONTEND_URL`        | No       | Frontend URL for Stripe (default `http://localhost:5173`) |
| `STRIPE_SECRET_KEY`   | Payments | Stripe secret key             |
| `STRIPE_WEBHOOK_SECRET` | Payments | Webhook signing secret       |

See `.env.example` for the full list.

---

## How to use the app

**Buyer:** Dashboard → My Business (add address) → Discover (filter by type/postcode) → View catalog → Place order → My Orders / My Invoices (pay or download PDF).

**Provider:** Dashboard → Profile → Products → Orders (filter by status/date) → Confirm/Reject → Mark preparing → Mark dispatched → Mark delivered → Create invoice.

**Test page:** `test-api.html` in the project root for seed, fix passwords, and API login.

---

## Project structure

```
b2b/
├── src/                 # NestJS backend
│   ├── auth/            # JWT, guards
│   ├── config/          # TypeORM
│   ├── entities/
│   ├── modules/         # order, payment, discovery, delivery, business, provider, admin
│   ├── migrations/
│   └── seeds/
├── frontend/            # React + Vite
│   └── src/             # api, components, pages, context
├── docs/                # Architecture, payment testing
├── test-api.html
├── .env.example
└── README.md
```

---

## Scripts

| Command                    | Description              |
| -------------------------- | ------------------------ |
| `npm run start:dev`       | Start API (watch)        |
| `npm run build`           | Build API                |
| `npm run migrate`         | Run migrations           |
| `npm run seed:fix-passwords` | Fix seed user passwords |
| `npm run lint`            | ESLint                   |
| `npm run test`            | Unit tests               |

**Frontend** (from `frontend/`): `npm run dev` | `npm run build` | `npm run preview`

---

## Pushing to GitHub

1. Ensure `.gitignore` exists and includes `node_modules/`, `.env`, `dist/`
2. Do **not** commit `.env`
3. Then:

```bash
git init
git add .
git commit -m "Initial commit: B2B Marketplace MVP"
git remote add origin https://github.com/stylianos1995/b2b.git
git branch -M main
git push -u origin main
```

Use a **Personal Access Token** as password when Git prompts for credentials.

---

## More docs

- [SETUP.md](SETUP.md) — Short setup guide
- [docs/PAYMENT-TESTING.md](docs/PAYMENT-TESTING.md) — Stripe testing
- [docs/](docs/) — System design, flows, schema

---

## License

Private or per your organization's policy.
