# 5. Tech Stack Proposal

## 5.1 Frontend

| Layer         | Option A (MVP default)                                 | Option B            | Notes                                                                      |
| ------------- | ------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------- |
| Framework     | Next.js 14+ (App Router)                               | Vite + React        | Next.js gives SSR, API routes, simple deploy. Vite is lighter if SPA-only. |
| Language      | TypeScript                                             | TypeScript          | Strict TS for both.                                                        |
| UI            | Tailwind CSS + headless components (Radix, React Aria) | Chakra, MUI         | Tailwind + Radix keeps bundle small and accessible.                        |
| Data fetching | TanStack Query (React Query)                           | SWR                 | Query cache, refetch, mutations.                                           |
| State         | Zustand or React Context                               | Redux               | Minimal global state; server state in Query.                               |
| Forms         | React Hook Form + Zod                                  | Formik + Yup        | RHF + Zod for validation and small bundle.                                 |
| Maps          | Mapbox GL JS or Google Maps JS                         | Leaflet + OSM       | For discovery and address selection.                                       |
| Mobile (V1)   | PWA first                                              | React Native (Expo) | PWA for MVP; add RN if mobile traffic justifies.                           |

---

## 5.2 Backend

| Layer      | Option A                                   | Option B            | Notes                                                             |
| ---------- | ------------------------------------------ | ------------------- | ----------------------------------------------------------------- |
| Runtime    | Node.js 20 LTS                             | —                   |                                                                   |
| Framework  | NestJS                                     | Fastify + structure | NestJS: DI, modules, good for teams. Fastify: raw speed.          |
| Language   | TypeScript                                 | TypeScript          | Same as frontend; shared types possible.                          |
| Validation | class-validator + class-transformer or Zod | Zod                 | DTOs and request validation.                                      |
| ORM        | Prisma                                     | TypeORM, Drizzle    | Prisma: migrations, type-safe client. Drizzle: lighter, SQL-like. |

---

## 5.3 Database

| Component    | Choice                              | Notes                                                                 |
| ------------ | ----------------------------------- | --------------------------------------------------------------------- |
| Primary      | PostgreSQL 15+                      | JSONB for metadata, good indexing, reliable.                          |
| Migrations   | Prisma Migrate or Flyway            | Versioned, reversible where possible.                                 |
| Caching      | Redis 7                             | Sessions, rate limit, job queue, cache catalog/availability.          |
| Search (V1+) | PostgreSQL full-text or Meilisearch | PG sufficient for MVP; Meilisearch for better discovery search later. |

---

## 5.4 Auth

| Need     | Suggestion                  | Alternative             |
| -------- | --------------------------- | ----------------------- |
| Identity | Auth0 or Clerk              | Supabase Auth, NextAuth |
| Tokens   | JWT (short-lived) + refresh | Same                    |
| MFA      | Built into Auth0/Clerk      | —                       |

Use hosted auth for MVP to avoid building and securing flows. Backend validates JWT and maps to user + business/provider.

---

## 5.5 Payments

| Need                 | Suggestion                           | Notes                                                        |
| -------------------- | ------------------------------------ | ------------------------------------------------------------ |
| Accept payments      | Stripe                               | Checkout Session for invoices; Payment Intents if custom UI. |
| Payouts to providers | Stripe Connect (Express or Standard) | Onboarding and payouts.                                      |
| Idempotency          | Stripe + own key in DB               | Store idempotency key per order/payment.                     |

No card storage; PCI handled by Stripe.

---

## 5.6 Maps / Location

| Need             | Suggestion                                 | Notes                                |
| ---------------- | ------------------------------------------ | ------------------------------------ |
| Geocoding        | Google Maps Geocoding or Mapbox Geocoding  | Address → lat/lng for radius search. |
| Display / search | Mapbox GL or Google Maps JS                | Discovery map and address picker.    |
| Distance         | PostGIS (PG extension) or Haversine in app | PostGIS for “providers within N km”. |

---

## 5.7 Notifications

| Channel | Service                                     | Notes                                                        |
| ------- | ------------------------------------------- | ------------------------------------------------------------ |
| Email   | Resend, Postmark, or SendGrid               | Transactional templates.                                     |
| Push    | Firebase Cloud Messaging (FCM) or OneSignal | When adding push in V1.                                      |
| SMS     | Twilio                                      | Optional; for critical alerts.                               |
| In-app  | Own table + WebSocket or polling            | Notifications table; real-time via same WebSocket as orders. |

---

## 5.8 Hosting

| Component | Suggestion                                        | Alternative                                             |
| --------- | ------------------------------------------------- | ------------------------------------------------------- |
| Frontend  | Vercel                                            | Netlify, Cloudflare Pages                               |
| Backend   | Railway, Render, or Fly.io                        | Single region for MVP.                                  |
| DB        | Managed PostgreSQL (Railway, Supabase, Neon, RDS) | Backups and point-in-time recovery.                     |
| Redis     | Upstash (serverless) or Redis Cloud               | Upstash good for variable load.                         |
| Storage   | S3-compatible (AWS S3, Cloudflare R2)             | Invoices PDFs, avatars, documents.                      |
| Queue     | Same Redis + BullMQ                               | Or provider queue (e.g. Inngest, Trigger.dev) for jobs. |

---

## 5.9 CI/CD

| Step    | Tool                                                         | Notes                                                                 |
| ------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Repo    | GitHub (or GitLab)                                           |                                                                       |
| CI      | GitHub Actions                                               | Lint, typecheck, unit tests, build on PR/push.                        |
| E2E     | Playwright or Cypress                                        | Smoke on critical flows (login, place order). Run on main or nightly. |
| Deploy  | GitHub Actions → Vercel (frontend), Railway/Render (backend) | Or use provider’s Git integration.                                    |
| Secrets | Env vars in platform; no secrets in repo                     | Rotate keys periodically.                                             |

---

## 5.10 Analytics

| Use            | Tool                            | Notes                                                              |
| -------------- | ------------------------------- | ------------------------------------------------------------------ |
| Product events | PostHog, Mixpanel, or Amplitude | Events: signup, order_placed, invoice_paid. No PII in event names. |
| Errors         | Sentry                          | Backend and frontend.                                              |
| Uptime         | Better Uptime, Pingdom          | Alerts on 5xx or downtime.                                         |

Avoid marketing buzzwords; focus on events that drive product and ops decisions.
