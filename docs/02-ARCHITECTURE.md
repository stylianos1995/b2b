# 2. App Architecture

## 2.1 High-Level Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ Web (React)  │  │ Mobile       │  │ Admin        │                   │
│  │ Buyer +      │  │ (React       │  │ Dashboard    │                   │
│  │ Provider     │  │ Native / PWA)│  │ (React)      │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
└─────────┼─────────────────┼─────────────────┼──────────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────┼─────────────────────────────────────────────┐
│                    API GATEWAY / BFF (optional)                          │
│                            │                                              │
│  ┌─────────────────────────▼─────────────────────────┐                   │
│  │              Backend API (REST + GraphQL opt.)     │                   │
│  │  Auth │ Orders │ Catalog │ Invoices │ Payments    │                   │
│  └─────────────────────────┬───────────────────────┘                   │
└─────────────────────────────┼──────────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────────┐
│  ┌────────────┐  ┌───────────▼──────────┐  ┌────────────┐  ┌───────────┐ │
│  │ PostgreSQL │  │ Redis (cache,        │  │ Message    │  │ Object    │ │
│  │ (primary)  │  │ sessions, queues)   │  │ Queue      │  │ Storage   │ │
│  └────────────┘  └─────────────────────┘  └────────────┘  └───────────┘ │
│                                                                          │
│  External: Auth0/Clerk, Stripe, Maps API, Push, Email/SMS                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2.2 Frontend Structure

### Web (Buyer + Provider)

- **Single app or two apps:** One SPA with role-based views is simpler for MVP; split buyer/provider apps only if UX or release cycles diverge.
- **Suggested structure (monorepo):**
  - `apps/web` – Next.js or Vite+React SPA
  - `packages/ui` – shared components, design tokens
  - `packages/api-client` – generated or hand-written API client
  - `packages/auth` – auth hooks, guards
- **Routes:** Split by role after login: `/buyer/*`, `/provider/*`, `/auth/*`. Shared: landing, login, password reset.
- **State:** Server state via React Query or SWR; minimal client state (Zustand or Context). Cart/order draft in localStorage or server (preferred for multi-device).

### Mobile

- **Option A – PWA:** One codebase with web; offline-capable for order history and draft orders; push via web push. Lower cost, good for MVP.
- **Option B – React Native / Expo:** Single codebase for iOS and Android; better native UX and push. Use when mobile usage justifies it.
- **Option C – Native (Swift/Kotlin):** Only if required for performance or platform-specific features later.
- **Recommendation:** Start with responsive web + PWA; add React Native in V1 if metrics show strong mobile usage.

### Admin Dashboard

- **Separate app or area:** Dedicated app under `/admin` or subdomain `admin.<product>.com`.
- **Features:** User/business/provider verification, dispute handling, analytics, feature flags, content moderation.
- **Auth:** Same identity provider; admin role checked in backend; dashboard only renders for admin users.

---

## 2.3 Backend Structure

- **Single deployable service for MVP:** One API process (e.g. Node/Nest, Go, .NET) handling HTTP, WebSockets, and background jobs. Avoid microservices until scaling or team size demands it.
- **Layered structure:**
  - **API / Transport:** REST (and optionally GraphQL for complex buyer discovery). Versioning: URL prefix `/v1/`.
  - **Application / Use cases:** Handlers for “Place order”, “Confirm delivery”, “Issue invoice”. Orchestrate domain and infrastructure.
  - **Domain:** Entities, value objects, domain rules (e.g. order state machine, pricing rules).
  - **Infrastructure:** DB access, external APIs (payments, maps, email), file storage.
- **Background jobs:** Order generation from subscriptions, invoice generation, reminder emails, trust score aggregation. Use a single queue (e.g. Bull/BullMQ with Redis, or DB-based queue for simplicity).

---

## 2.4 API Architecture

- **REST:** Resource-oriented. Examples:
  - `GET /v1/buyer/orders`, `POST /v1/buyer/orders`, `GET /v1/buyer/orders/:id`
  - `GET /v1/buyer/providers` (discovery, with query params for filters)
  - `GET /v1/provider/orders`, `PATCH /v1/provider/orders/:id` (confirm, update status)
  - `GET /v1/provider/products`, `POST /v1/provider/products`
  - `GET /v1/invoices`, `POST /v1/invoices/:id/payments`
- **Auth:** Every request: `Authorization: Bearer <access_token>`. Optional: API keys for provider integrations later.
- **Idempotency:** For `POST /orders`, `POST /payments`: `Idempotency-Key` header to avoid duplicate orders/payments on retry.
- **Pagination:** Cursor-based for lists (e.g. `?cursor=...&limit=20`). Return `next_cursor` and `has_more`.
- **Errors:** Consistent JSON: `{ "code": "...", "message": "...", "details": {} }`. HTTP status reflects outcome (4xx client, 5xx server).
- **Optional GraphQL:** Single endpoint for buyer discovery (complex filters, nested catalog) and dashboard analytics. Not required for MVP.

---

## 2.5 Database Structure

- **Primary store:** PostgreSQL. Use normalised schema from section 1; indexes on: `orders(business_id, status, created_at)`, `orders(provider_id, status)`, `products(provider_id, is_active)`, `invoices(provider_id, status)`, `payments(payable_type, payable_id)`, `ratings(provider_id)`.
- **Migrations:** Versioned migrations (e.g. Flyway, Liquibase, or framework migrations). No schema changes without a migration.
- **Read replicas:** Add when read load justifies it (V2). Use for discovery and reporting; writes stay on primary.
- **Caching:** Cache provider catalog and availability in Redis by `provider_id` and invalidation on catalog/availability update. Short TTL (e.g. 1–5 min) acceptable for MVP.

---

## 2.6 Authentication System

- **Flow:** OAuth2 + OIDC. Users log in via hosted auth (e.g. Auth0, Clerk, Supabase Auth); backend receives JWT or validates token with provider.
- **Tokens:** Access token (short-lived, e.g. 15–60 min) and refresh token (long-lived, stored securely). Backend validates signature and expiry; optionally checks revocation.
- **Linking identity to entities:** After login, backend resolves `user_id` from token, then loads `BusinessUser` or `ProviderUser` to get `business_id` or `provider_id` and role. All subsequent requests are scoped to that entity.
- **MFA:** Enforced for admin and optionally for provider users handling payments. Supported by the same auth provider.
- **Logout:** Client discards tokens; optional token revocation endpoint calling auth provider.

---

## 2.7 Role-Based Access Control (RBAC)

- **Roles:**
  - **Buyer side:** Owner (full), Admin (full except billing/delete), Staff (place orders, view orders), Viewer (read-only).
  - **Provider side:** Owner, Admin, Catalog Manager, Order Fulfilment, Finance (invoices/payments), Viewer.
  - **Platform:** Super Admin, Support (read + limited actions), Finance (payouts, disputes).
- **Implementation:** Store role per (user, business) and (user, provider) in `BusinessUser`, `ProviderUser`. Middleware loads role and attaches to request. Handlers check permission for action (e.g. “place_order” requires Staff or above on Business). Prefer permission-based checks (e.g. “orders:create”) so roles map to permission sets.
- **Data scope:** All queries filter by `business_id` or `provider_id` from the authenticated context so users never see other businesses’ or providers’ data.

---

## 2.8 Real-Time Features

- **Use cases:** Order status updates (buyer and provider), delivery status, new order alert for provider.
- **Mechanism:** WebSockets (e.g. Socket.io, or managed service like Ably/Pusher). Client connects after login; server joins user to rooms: `business:{id}`, `provider:{id}`. On order status change, backend emits to both rooms.
- **Fallback:** Long polling or frequent GET for MVP if WebSockets are deferred. Clients poll `GET /v1/orders/:id` or list until status changes.
- **Delivery tracking:** If carrier provides webhooks, backend receives updates and re-emits to socket room; alternatively poll carrier API on a schedule and update Delivery entity.

---

## 2.9 Notification System

- **Channels:** Email (required), in-app (optional), push (optional), SMS (optional, for critical alerts).
- **Events:** Order submitted, order confirmed, order shipped, order delivered, invoice issued, payment received, dispute opened. Template per event and channel.
- **Implementation:** Event emitted from application (e.g. “OrderSubmitted”); single notification worker consumes events and enqueues per-channel jobs (send email, send push). Use a provider (SendGrid, Postmark, Twilio, FCM).
- **Preferences:** Table `notification_preferences(user_id, channel, event_type, enabled)`. Default: email on for all; user can opt down. No need for complex preference UI in MVP.

---

## 2.10 Payment System

- **Flows:** (1) Buyer pays invoice via card or bank transfer. (2) Optional: pay on order (charge when order is placed). (3) Platform pays out to provider (minus commission) on a schedule.
- **Provider:** Stripe Connect or similar so each provider can receive payouts; platform holds or routes funds. Alternatively, platform holds funds and runs payouts via batch bank transfers (more compliance work).
- **Storage:** Do not store full card numbers. Store payment method references (Stripe PaymentMethod ID) or use hosted checkout and only store `external_id` and outcome.
- **Idempotency:** All charge and payout API calls use idempotency keys; store mapping in DB to avoid duplicate charges on retry.
- **Reconciliation:** Payments table is source of truth; nightly job matches with Stripe (or bank) and flags discrepancies.

---

## 2.11 Admin Dashboard

- **Access:** Same auth; “admin” or “support” role required. Dashboard is a separate SPA or area, calling same API with admin-only endpoints.
- **Endpoints:** `GET/PATCH /v1/admin/users`, `GET/PATCH /v1/admin/businesses`, `GET/PATCH /v1/admin/providers`, `GET/POST /v1/admin/disputes`, `GET /v1/admin/analytics/*`. All enforce admin role and audit log sensitive actions.
- **Features:** Verify business/provider (approve documents, set status), resolve disputes (refund, partial refund, close), view platform metrics, manage feature flags, send system announcements.
