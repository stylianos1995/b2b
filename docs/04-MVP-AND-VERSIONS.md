# 4. MVP vs Scalable Version

## 4.1 MVP (Lean but Functional)

**Goal:** Validate two-sided demand with minimal build. One geographic area, limited provider types, manual operations where acceptable.

### In Scope

- **Users:** Email/password signup and login. One role per user (either buyer or provider; no multi-entity in MVP).
- **Business:** Single business per user. Basic profile: name, type, one location (address + optional postcode). No document verification.
- **Provider:** Single provider per user. Basic profile, one location (warehouse/office). No verification.
- **Catalog:** Products only (no services). Name, SKU, unit, price, category. No bulk import; no variants.
- **Discovery:** List providers by postcode/radius or region. Filter by category. No ranking algorithm; sort by name or distance.
- **Orders:** Single delivery address per order. Cart → submit → order created. Provider confirms or rejects manually. Status: submitted, confirmed, preparing, delivered, cancelled. No delivery slots; only requested date.
- **Delivery:** Single delivery record per order; provider updates status manually (no carrier integration).
- **Invoices:** One invoice per order. Manual creation by provider after delivery. No auto-invoice.
- **Payments:** Buyer pays invoice via Stripe Checkout (redirect). No stored payment methods. No payouts automation; manual payouts to providers.
- **Notifications:** Email only (order submitted, confirmed, delivered; invoice issued). No in-app or push.
- **No subscriptions/recurring orders.** No contracts. No disputes UI (use email/support).
- **No ratings/trust score in UI** (collect data only for later).
- **Admin:** Minimal: list users, businesses, providers; toggle active/suspended. No analytics.

### Out of Scope for MVP

- Recurring orders, subscriptions
- Services in catalog
- Multiple locations per business
- Verification workflows, documents
- Trust score, ratings display, ranking
- Dispute flow in-app
- Real-time (use polling)
- Mobile app (responsive web + PWA)
- Multi-currency; single currency (e.g. GBP)
- Payout automation

---

## 4.2 V1 Production

**Goal:** Reliable production use in one or few regions. Support team and basic automation.

### Additions

- **Auth:** MFA for provider and admin. Invite team members (BusinessUser, ProviderUser) with roles.
- **Business:** Multiple locations. Document upload and verification (admin approves).
- **Provider:** Verification workflow. Multiple users and roles. Service area and delivery windows (availability); order validation against availability.
- **Catalog:** Services. Bulk product import (CSV). Optional product availability/stock.
- **Discovery:** Provider ranking by rating and reliability. Filters: delivery window, min order value. Trust score visible.
- **Orders:** Delivery slots (from availability). Recurring orders: subscription entity, job generates orders. Order notes and internal notes.
- **Delivery:** Optional carrier tracking (one integration, e.g. DPD or generic webhook). Proof of delivery upload.
- **Invoices:** Auto-invoice on delivery (configurable). One invoice can aggregate multiple orders (e.g. weekly). Payment terms (due in N days).
- **Payments:** Stored payment methods. Pay on order (optional). Automated payouts to providers (Stripe Connect) on schedule.
- **Notifications:** In-app (mark as read). Push (web push or FCM). Optional SMS for critical alerts. Preference per channel.
- **Disputes:** In-app dispute creation, thread, admin resolution (refund/partial/close).
- **Ratings:** Buyers rate after delivery; provider profile shows average and count. Dimensions optional.
- **Admin:** Dispute queue, basic analytics (orders per day, GMV, active users), audit log, feature flags.
- **Real-time:** WebSockets for order and delivery status.
- **Mobile:** PWA with offline order history and push; or React Native app.

---

## 4.3 V2 Scaling

**Goal:** Multiple regions, high volume, performance, and extensibility.

### Additions

- **Multi-tenant/region:** Region-specific catalogs, pricing, compliance. Optional multi-currency and multi-language.
- **Catalog:** Product variants, inventory sync, dynamic pricing (e.g. by business or contract).
- **Contracts:** Framework agreements, credit limits, payment terms per business-provider pair. Pricing overrides from contracts.
- **Discovery:** Advanced ranking (ML or rules), personalised recommendations, saved searches.
- **Orders:** Bulk ordering, quotes, approval workflows (e.g. manager approves order). More carrier integrations.
- **Invoicing:** Consolidated statements, net terms, credit management.
- **Payments:** Multiple gateways, SEPA/direct debit, platform balance/wallet. Reconciliation and dispute automation.
- **Analytics:** Provider dashboard (sales, top products, repeat rate). Buyer dashboard (spend by provider, trends). Platform analytics and reporting.
- **API for providers:** REST API for catalog and order sync (for ERPs). Webhooks for order and payment events.
- **Infrastructure:** Read replicas, caching layer, queue-based workers, event sourcing for critical flows if needed. Microservices only where clear bounded context (e.g. payments, notifications).
- **Compliance:** Audit trails, data retention, GDPR tools, export.
