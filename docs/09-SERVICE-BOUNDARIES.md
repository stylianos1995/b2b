# SERVICE BOUNDARIES

## Platform service boundary model

---

## 1) Core Services

### Identity / Auth Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility** | Authentication (login, logout, token issue/refresh), identity verification (email/phone), MFA, session lifecycle. Resolves authenticated principal (user_id) and supplies membership context (business_id, provider_id, role) for authorization. Does not implement business or provider domain logic.                                                                                                         |
| **Owned data**     | User (id, email, phone, password_hash, first_name, last_name, avatar_url, email_verified_at, phone_verified_at, status, locale, timezone, created_at, updated_at). Session (id, user_id, token_ref, expires_at, revoked_at). No Business or Provider entity data; only linkage tables: BusinessUser (user_id, business_id, role), ProviderUser (user_id, provider_id, role).                                   |
| **Exposed APIs**   | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `POST /auth/forgot-password`, `POST /auth/reset-password`. `GET /auth/me` (returns user + list of memberships with business_id/provider_id and role). Internal (to other services): `ResolvePrincipal(token)` → (user_id, memberships[]). Token validation and membership resolution only; no CRUD on Business/Provider. |
| **Dependencies**   | None on other platform services. Depends on external IdP if delegated (e.g. Auth0, Clerk) for token issue; then only validates and resolves. Optional: Notification Service to send verification and password-reset emails (via event or async call).                                                                                                                                                          |
| **Boundaries**     | Does not store or interpret Order, Invoice, Payment, Product, or Location. Does not decide permissions beyond “who is this and what memberships do they have?” Permission evaluation (e.g. can this role do X?) is either in Identity (as a thin policy layer) or in the service that owns the resource. Identity never writes to Business or Provider tables.                                                 |

---

### Business Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility** | Lifecycle and data of the buyer entity: business profile, business locations (delivery addresses), business–user membership (BusinessUser), preferred suppliers list, subscriptions (recurring order templates). Validation of business-level invariants (e.g. at least one location before ordering). Does not create or modify orders; provides business and location data to Order Service when an order is created.                                                                           |
| **Owned data**     | Business, Location (where owner_type = Business, owner_id = business_id), BusinessUser, PreferredSupplier, Subscription, SubscriptionLine.                                                                                                                                                                                                                                                                                                                                                        |
| **Exposed APIs**   | `GET/POST/PATCH /businesses`, `GET/PATCH /businesses/:id`. `GET/POST/PATCH/DELETE /businesses/:id/locations`. `GET/POST/DELETE /businesses/:id/members` (BusinessUser). `GET/POST/DELETE /businesses/:id/preferred-suppliers`. `GET/POST/PATCH/DELETE /businesses/:id/subscriptions`. Internal: `GetBusiness(id)`, `GetLocation(id)`, `GetBusinessWithLocations(business_id)` for Order and other services. All mutations require authenticated user with appropriate role; scope by business_id. |
| **Dependencies**   | Identity Service for principal and role resolution. Order Service may call Business to resolve delivery address or business details when creating an order; alternatively Order Service receives business_id and location_id and trusts them (with validation that location belongs to business). Search/Discovery may read business profile (read-only) for admin or reporting.                                                                                                                  |
| **Boundaries**     | Does not own Order, Invoice, Payment, Product, Provider, or Delivery. Does not compute trust, ranking, or pricing. Subscription defines “what and when”; Order Service (or a scheduler) creates Order records. Business Service does not call Payment or Logistics.                                                                                                                                                                                                                               |

---

### Provider Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility** | Lifecycle and data of the seller entity: provider profile, provider locations (warehouses/offices), provider–user membership (ProviderUser), catalog (Product, Service), Availability (delivery windows, service area), contracts (Contract) offered to businesses. Validation of provider-level invariants (e.g. product belongs to provider). Does not create or modify orders; provides provider, product, and availability data to Order and Search/Discovery.                                                                                   |
| **Owned data**     | Provider, Location (owner_type = Provider), ProviderUser, Product, Service, Availability, Contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Exposed APIs**   | `GET/POST/PATCH /providers`, `GET/PATCH /providers/:id`. `GET/POST/PATCH/DELETE /providers/:id/locations`. `GET/POST/DELETE /providers/:id/members`. `GET/POST/PATCH/DELETE /providers/:id/products`, `GET/POST/PATCH/DELETE /providers/:id/services`. `GET/POST/PATCH/DELETE /providers/:id/availability`. `GET/POST/PATCH /providers/:id/contracts`. Internal: `GetProvider(id)`, `GetProducts(provider_id)`, `GetAvailability(provider_id)`, `ValidateProductForProvider(product_id, provider_id)`. All mutations scoped by provider_id and role. |
| **Dependencies**   | Identity for principal and role. Order Service validates product_ids and provider_id when creating orders; may call Provider for product snapshot (price, name, unit) or receives snapshot from API. Search/Discovery reads provider, products, availability (read-only). Trust Service may read provider id and rating aggregates; Provider does not own ratings.                                                                                                                                                                                   |
| **Boundaries**     | Does not own Order, Invoice, Payment, Delivery, or Rating. Does not compute trust score or ranking. Does not send notifications or execute payments. Contract is an agreement record; payment terms or pricing in Contract may be consumed by Order/Payment when applicable.                                                                                                                                                                                                                                                                         |

---

### Order Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility** | Order lifecycle: create order (cart → submitted), confirm/reject, state transitions (preparing, shipped, delivered, cancelled). Order line snapshots (product/service, quantity, price at order time). Validation of order rules: min order value, availability window, lead time. Generation of orders from subscriptions (scheduler consumes Subscription from Business Service and creates Order). Does not process payment or update delivery tracking; coordinates with Payment and Logistics.                                                                                                                                                                                       |
| **Owned data**     | Order, OrderLine.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Exposed APIs**   | `POST /orders` (create; idempotent by key). `GET /orders`, `GET /orders/:id`. `PATCH /orders/:id` (status, internal_notes). `POST /orders/:id/cancel`. Internal: `CreateOrderFromSubscription(subscription_id, due_date)`. Buyer APIs scoped by business_id; provider APIs scoped by provider_id. Order creation accepts business_id, provider_id, delivery_location_id, lines (product_id or service_id, quantity); service resolves product/service snapshot from Provider Service or from request payload validated against Provider.                                                                                                                                                  |
| **Dependencies**   | Identity (principal, role, scope). Business Service: resolve business and delivery location (or accept and validate location_id belongs to business_id). Provider Service: validate provider and products/services, get snapshot for lines. Payment Service: after order submitted, may need to reserve or charge (if pay-on-order); otherwise Payment is invoice-driven. Logistics Service: one Delivery per order; Order Service creates Delivery record or delegates to Logistics. Trust Service: after delivery, order is rateable (Trust consumes order_id, provider_id, business_id). Notification Service: events (OrderSubmitted, OrderConfirmed, etc.) to trigger notifications. |
| **Boundaries**     | Does not own Invoice, Payment, or User/Business/Provider profile. Does not compute prices beyond snapshot at order time. Does not send email/push. Does not update trust or ranking. Order line and monetary fields immutable after submit; only status and delivery-related fields change.                                                                                                                                                                                                                                                                                                                                                                                               |

---

### Payment Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility** | Invoicing and payment lifecycle: create and issue invoices (linked to orders or ad-hoc), record payments (card, transfer, platform balance), refunds, payout to providers. Reconciliation with external gateway. Enforces payment rules (e.g. invoice due date, single payment per invoice for MVP). Does not change order state; reads order total and status for invoice creation.                                                                                                                                                                                                                                |
| **Owned data**     | Invoice, InvoiceLine, Payment. Payout run metadata (id, provider_id, amount, status, executed_at) if applicable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Exposed APIs**   | `POST /invoices`, `GET /invoices`, `GET /invoices/:id`, `PATCH /invoices/:id` (status: issue, cancel). `POST /invoices/:id/payments` (initiate payment; idempotent). `GET /payments`. Internal: `CreateInvoiceForOrder(order_id)`, `RecordPayment(payable_type, payable_id, amount, external_id, status)`, `Refund(payment_id, amount)`, `TriggerPayout(provider_id, amount)`. Webhook endpoint for gateway: `POST /webhooks/payments` (verify signature, map to RecordPayment). Buyer-scoped: list invoices and payments for their business. Provider-scoped: list invoices and payout history for their provider. |
| **Dependencies**   | Identity for principal and scope. Order Service: read order total and status for invoice creation; no write to Order. External payment gateway (Stripe, etc.) for charge and refund. Provider Service: resolve provider for payout routing. Notification Service: InvoiceIssued, PaymentReceived events. Admin/PlatformFinance: payout and reconciliation APIs.                                                                                                                                                                                                                                                     |
| **Boundaries**     | Does not own Order or Delivery. Does not modify order state when payment succeeds (optional: Order Service subscribes to PaymentCompleted and updates internal state if needed). Does not store card details; uses gateway tokens or redirect. Does not send notifications directly; emits events. Payment record immutable after completed; refund creates new record or linked refund entity.                                                                                                                                                                                                                     |

---

### Logistics Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility** | Delivery lifecycle: create delivery record for an order, update status (scheduled, picked_up, in_transit, delivered, failed), store tracking code and proof of delivery. Optional: consume carrier webhooks or poll carrier API and map to delivery status. Provides delivery status to Order Service or clients for tracking. Does not modify order lines or payment.                                                             |
| **Owned data**     | Delivery.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Exposed APIs**   | `GET /deliveries`, `GET /deliveries/:id`. `PATCH /deliveries/:id` (status, tracking_code, estimated_delivery_at, actual_delivery_at, proof_of_delivery_url). Internal: `CreateDelivery(order_id)`, `UpdateDeliveryStatus(delivery_id, status, ...)`. Provider and LogisticsAgent (system) can update; buyer read-only. Webhook or callback for external carrier: `POST /webhooks/logistics` (verify, map to UpdateDeliveryStatus). |
| **Dependencies**   | Identity for principal and LogisticsAgent identity. Order Service: one Delivery per Order; creation may be triggered by Order Service when order is confirmed or by Logistics when order is first dispatched. Optional: external carrier API for tracking. Notification Service: DeliveryStatusChanged events.                                                                                                                     |
| **Boundaries**     | Does not own Order, Invoice, or Payment. Does not read order line items or pricing; only order_id and delivery address (if needed for fulfilment). Does not compute trust or ratings; Trust Service may consume delivery timestamps for on-time metrics.                                                                                                                                                                           |

---

### Trust / Rating Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility** | Ratings (submit, store, moderate), aggregation of provider trust metrics (average rating, count, on-time delivery rate, dispute rate), and computation of trust score and ranking inputs. Exposes read-only scores and rankings to Search/Discovery and provider profile. Does not own Order, Delivery, or Invoice; consumes events or reads via narrow APIs to compute metrics. |
| **Owned data**     | Rating (order_id, business_id, provider_id, rating, dimensions, comment, is_visible, created_at). ProviderStats or equivalent (provider_id, avg_rating, rating_count, on_time_rate, etc.) materialized from events or periodic job. Ranking/trust score parameters (weights, thresholds) may be stored here or in Admin Service; computation is in Trust.                        |
| **Exposed APIs**   | `POST /ratings` (buyer submits for an order). `GET /providers/:id/ratings` (public or scoped). `GET /providers/:id/stats` (aggregate score, count, on-time rate). Internal: `GetProviderRankingInput(provider_id)`, `GetTrustScore(provider_id)`. Search/Discovery and Provider profile call these for display and sort. Admin: update ranking weights or visibility rules.      |
| **Dependencies**   | Identity for principal (only buyer can rate own order). Order Service or events: order delivered so that it can be rated. Logistics or Order: delivery timestamps for on-time calculation. Payment or Admin: dispute data for dispute rate (optional). No write dependency on other services.                                                                                    |
| **Boundaries**     | Does not own Order, Delivery, or Invoice. Does not send notifications. Does not modify order or payment. Receives events (OrderDelivered, DisputeResolved) or runs batch over read-only data. Ranking algorithm and weights are a control point (Admin/Platform only).                                                                                                           |

---

## 2) Support Services

### Notification Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Responsibility** | Send outbound notifications: email, push, SMS, in-app. Consumes events (OrderSubmitted, OrderConfirmed, InvoiceIssued, PaymentReceived, DeliveryStatusChanged, etc.) and applies templates and user preferences. Does not contain business logic; only delivery and preference resolution. |
| **Owned data**     | NotificationPreference (user_id, channel, event_type, enabled). Optional: Notification (id, user_id, channel, event_type, payload, read_at, created_at) for in-app. Outbound log (id, channel, recipient_ref, event_type, sent_at, status) for audit.                                      |
| **Exposed APIs**   | Internal only: `Notify(event_type, payload)` or subscribe to event bus. No public APIs. Admin may have “send system announcement” or “resend verification”.                                                                                                                                |
| **Dependencies**   | Identity: resolve user email/phone for delivery. Order, Payment, Logistics, Trust: none (Notification consumes events; payload contains minimal identifiers and message keys). External: email provider, push provider, SMS provider.                                                      |
| **Boundaries**     | Does not read Order, Invoice, or Payment content beyond what is in the event payload. Does not decide order or payment state. Single responsibility: deliver messages.                                                                                                                     |

---

### Analytics Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility** | Aggregate and report: counts, sums, trends (orders per day, GMV per provider/business), funnel metrics. Consumes events or reads from other services via read-only APIs or replicated data. Does not modify transactional data. Exposes dashboards and reports to Platform and optionally to Business/Provider within their scope. |
| **Owned data**     | Aggregated tables or OLAP schema (e.g. daily_order_counts, provider_gmv, business_spend). Event stream or ETL staging. No ownership of User, Order, Invoice, Payment; only derived data.                                                                                                                                           |
| **Exposed APIs**   | Internal: used by Admin dashboard and reporting. `GET /analytics/orders` (platform), `GET /analytics/provider/:id` (provider-scoped), `GET /analytics/business/:id` (business-scoped). All scoped by permission; no PII in responses unless required and authorised.                                                               |
| **Dependencies**   | Order, Payment, Business, Provider: read-only or event stream. Identity: resolve scope for provider/business reports. Admin Service for access control to platform analytics.                                                                                                                                                      |
| **Boundaries**     | Does not write to Order, Payment, or Identity. No real-time transactional path; analytics are eventually consistent. No direct DB access to other services’ databases; use events or published read models.                                                                                                                        |

---

### Search / Discovery Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility** | Provider discovery: search and filter providers by geography, category, availability, rating, min order value. Return list of providers with summary data (name, rating, delivery info). May include product search within provider. Uses Trust Service for ranking and score; uses Provider Service for catalog and availability (read-only or replicated). Does not create or modify orders or providers. |
| **Owned data**     | Search index (provider documents, product documents) built from Provider and Product data. Index is owned and updated by ingestion from Provider Service (events or API). No ownership of Provider or Product source of truth.                                                                                                                                                                              |
| **Exposed APIs**   | `GET /discovery/providers?postcode=...&category=...&radius=...&sort=...`. `GET /discovery/providers/:id` (public summary). `GET /discovery/providers/:id/products` (catalog for ordering). All read-only.                                                                                                                                                                                                   |
| **Dependencies**   | Provider Service: catalog and availability (sync or event). Trust Service: ranking and trust score for sort/filter. Optional: Maps/geocoding for radius.                                                                                                                                                                                                                                                    |
| **Boundaries**     | Does not own Provider, Product, or Order. Does not write to any core service. Index is a derived view; updates are eventual. Ranking and visibility rules are control points (Trust/Admin).                                                                                                                                                                                                                 |

---

### Recommendation Service

| Aspect             | Definition                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Responsibility** | Optional. Produce “recommended” or “featured” providers for a business (e.g. based on history, segment, or manual curation). Consumes order history and business attributes; returns list of provider_ids. Used by Search/Discovery or UI. |
| **Owned data**     | Recommendation model or curated lists (featured_provider_ids, segment_rules). No ownership of Order or Provider.                                                                                                                           |
| **Exposed APIs**   | Internal: `GetRecommendations(business_id, limit)` or `GetFeaturedProviders()`.                                                                                                                                                            |
| **Dependencies**   | Order or Analytics: past orders per business. Trust: score. Provider: active providers. Admin: curated lists or feature flags.                                                                                                             |
| **Boundaries**     | Read-only on other services. Does not modify orders or visibility. Algorithm and featured list are control points (Admin).                                                                                                                 |

---

### Admin Service

| Aspect             | Definition                                                                                                                                                                                                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Responsibility** | Platform operations: verification (approve/reject business or provider), dispute workflow (view, resolve, refund linkage), feature flags and system config, audit log read, platform user and role assignment. Orchestrates reads and writes across services via their APIs; does not own core entities. Control point for ranking, trust, visibility, and payout rules. |
| **Owned data**     | VerificationQueue or status (references business_id/provider_id; actual status may live in Business/Provider). Dispute (id, order_id, status, resolution, created_at, resolved_at). FeatureFlag, SystemConfig. AuditLog (append-only). PlatformUser (platform role assignment).                                                                                          |
| **Exposed APIs**   | `GET/PATCH /admin/businesses`, `GET/PATCH /admin/providers` (verification, status). `GET/POST/PATCH /admin/disputes`. `GET/PATCH /admin/config`, `GET/PATCH /admin/feature-flags`. `GET /admin/audit`. `GET/POST/DELETE /admin/platform-users`. All require platform role; scope is platform.                                                                            |
| **Dependencies**   | Identity: platform role check. Business, Provider: update status. Order, Payment: read and optional status override. Trust: update ranking/visibility params. Payment: trigger refund or payout. All via API; Admin does not share DB with core services.                                                                                                                |
| **Boundaries**     | Does not own User, Business, Provider, Order, or Payment; only admin-specific entities (Dispute, Config, AuditLog). All mutations on core data go through the owning service’s API. Admin is the only service that may call “override” or “admin” endpoints on other services.                                                                                           |

---

## 3) External Integrations

| System              | Purpose                                                                  | Owner service                                    | Integration pattern                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Payments**        | Card capture, refunds, payouts (e.g. Stripe, Stripe Connect).            | Payment Service.                                 | Payment Service is sole caller. Webhooks (payment intent completed, payout paid) posted to Payment Service; verified by signature. No other service talks to payment gateway. |
| **Maps**            | Geocoding (address → lat/lng), distance, display.                        | Search/Discovery, Business (address validation). | Sync API call from service that needs it. No shared session; stateless. API key stored in config of calling service.                                                          |
| **Messaging**       | Email (SendGrid, Postmark), SMS (Twilio), push (FCM).                    | Notification Service.                            | Notification Service is sole caller. Other services do not send email/SMS/push directly.                                                                                      |
| **Logistics APIs**  | Carrier tracking (DPD, DHL, etc.).                                       | Logistics Service.                               | Logistics Service polls or receives webhooks; maps to Delivery status. Order and Payment do not call carriers.                                                                |
| **Tax / Invoicing** | VAT calculation, legal invoice format (e.g. Avalara, local e-invoicing). | Payment Service (invoice generation).            | Payment Service calls when creating invoice or line items. Optional; MVP may use simple tax_rate on product.                                                                  |

Rules: One service owns each external integration. Credentials and keys are stored in that service’s config or secret store. No other service embeds or calls the same integration for the same purpose.

---

## 4) Data Ownership Model

### Service data ownership

- Each core entity has a single owning service. That service is the only one that may write to the store that holds that entity. Ownership is defined in section 1.
- Summary:
  - Identity: User, Session, BusinessUser, ProviderUser
  - Business: Business, Location (business), PreferredSupplier, Subscription, SubscriptionLine
  - Provider: Provider, Location (provider), Product, Service, Availability, Contract
  - Order: Order, OrderLine
  - Payment: Invoice, InvoiceLine, Payment
  - Logistics: Delivery
  - Trust: Rating, ProviderStats (or equivalent)
  - Admin: Dispute, FeatureFlag, SystemConfig, AuditLog, PlatformUser
  - Notification: NotificationPreference, Notification (in-app), outbound log
  - Analytics: aggregated/reporting tables only
  - Search/Discovery: search index only (derived)

### Isolation rules

- A service’s persistent store is not accessed by another service’s process. No cross-service DB connections, no shared database.
- References across services are by id only (e.g. order has business_id, provider_id, delivery_location_id). The owning service holds the canonical record; others hold identifiers and optionally cached/snapshot data (e.g. order lines snapshot product name and price but do not join to Product table at read time in another service).

### Cross-service communication

- **Sync:** Call the owning service’s API when another service needs to read or request a mutation. Example: Order Service calls Business Service to validate delivery_location_id belongs to business_id, or calls Provider Service to get product snapshot.
- **Async:** Emit domain events (e.g. OrderSubmitted, OrderDelivered, InvoiceIssued) on a message bus or queue. Subscribers (Notification, Trust, Analytics, Payment) consume and act. Events carry only ids and minimal payload; no large documents. No reply channel required for fire-and-forget notifications or aggregations.
- **When to use event vs API:** Use API when the caller needs an immediate result (e.g. validate address, get product price). Use events when the action can be eventual (e.g. send email, update trust score, update search index). Never use events to implement a request–response flow that should be synchronous.

### Forbidden patterns

- **Shared database:** No two services write to the same database or same schema for owned entities.
- **Direct data manipulation:** No service issues SQL or writes to another service’s store. All writes go through the owning service’s API or event handler that owns the data.
- **Cross-service business logic:** Order validation (e.g. min order value) is implemented in Order Service; it may call Provider to read min_order_value but does not implement provider rules inside Order Service. No “god” service that orchestrates all domain rules.
- **Leaking ownership:** A service must not expose internal IDs or implementation details that would allow a caller to bypass the owner (e.g. exposing internal sequence or shard key).
- **Chatty sync chains:** Avoid long sync call chains (A → B → C → D). Prefer events for fan-out or async workflows; keep sync chain to two hops where possible.
- **Dual write:** No two services write the same fact. If two systems need to stay in sync, one is owner and the other consumes events or reads from owner.

---

## 5) Boundary Rules

### No shared databases

- Each service has its own database (or schema) for its owned entities. No table is written by more than one service. Read replicas or reporting copies are allowed only for the same service’s store.

### No cross-service business logic

- Domain rules (order state machine, invoice rules, trust formula) live in the service that owns the relevant entity. Other services do not implement or duplicate those rules. They may call the owner’s API to trigger or query; they do not contain a copy of the owner’s state machine or validation.

### No direct data manipulation

- No service connects to another service’s database. All reads and writes go through the owning service’s API. Exception: Analytics may consume a dedicated read replica or event stream owned by the same platform, with no write access to source services.

### Strict API contracts

- Service-to-service and public APIs have a defined contract (request/response schema, errors, idempotency keys where needed). Contracts are versioned (e.g. URL path `/v1/` or header `Accept-Version: 1`). Breaking changes introduce a new version; old version is deprecated and removed on a schedule. No undocumented or informal parameters.

### Versioned interfaces

- All public and internal service APIs are versioned. Clients specify version; server supports N and N-1 for a defined period. Internal events have a version or schema id in the payload; consumers ignore unknown versions or route to a handler that supports that version.

### Additional rules

- **Single writer:** For each entity, exactly one service is the writer. No “admin override” that writes directly to the DB; admin goes through the owning service’s admin API.
- **Fail-safe:** If a dependency is unavailable, a service may return an error or use a cached value according to policy; it must not silently write inconsistent data to its own store.
- **Idempotency:** Mutations that have side effects (order create, payment record) accept an idempotency key and return the same result on replay.
- **Audit:** State-changing operations in core and support services produce an audit trail (who, what, when, outcome). Admin Service or the owning service may store it; no service deletes or alters audit records.
