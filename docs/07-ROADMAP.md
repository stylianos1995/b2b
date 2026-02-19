# 7. Step-by-Step Execution Roadmap

## Phase 1: Concept & Validation

**Objective:** Confirm problem-solution fit and willingness to use the product before building.

### Technical goals

- None (no code). Optional: simple landing page + waitlist form; form writes to sheet or DB.

### Product goals

- Define ICP (e.g. independent restaurants in city X; small hotel chains).
- List 3–5 core jobs: discover supplier, compare, place order, pay invoice.
- Draft discovery and order flows on paper or Figma (low fidelity).

### Business goals

- 10+ signed expressions of interest from buyers; 5+ from providers (LOI, waitlist, or letter of intent).
- Clarify unit of value: order, subscription, or % of GMV.

### Validation checkpoints

- [ ] At least 5 buyer interviews: “Would you use this to find and order from suppliers?”
- [ ] At least 3 provider interviews: “Would you list your catalog and receive orders here?”
- [ ] Go/no-go: proceed to Phase 2 only if both sides show intent.

---

## Phase 2: System Design

**Objective:** Lock core entities, APIs, and scope so build is unambiguous.

### Technical goals

- Finalise data model (section 1) and get one round of review.
- Define API surface: list of endpoints, auth, idempotency, errors.
- Choose stack (section 5) and repo structure (monorepo recommended).
- Set up repo, lint, format, and one deploy pipeline (e.g. staging).

### Product goals

- Prioritise MVP scope (section 4.1); document exclusions.
- Write acceptance criteria for: signup (buyer + provider), add product, discovery, place order, confirm order, create invoice, pay invoice.

### Business goals

- Align on success metrics for MVP: e.g. 20 orders in first 4 weeks post-launch.
- Define support process (who handles “order not delivered”, “wrong invoice”).

### Validation checkpoints

- [ ] Data model and API doc reviewed (internal or technical advisor).
- [ ] MVP scope signed off; no “nice-to-have” in MVP build.
- [ ] Staging environment deployable from main branch.

---

## Phase 3: MVP Build

**Objective:** Ship a working product that supports discovery, ordering, and payment in one geography.

### Technical goals

- Implement auth (signup, login, JWT). One role per user (buyer or provider).
- Implement entities: User, Business, Provider, Location, Product, Order, OrderLine, Delivery, Invoice, InvoiceLine, Payment. Migrations and indexes.
- Implement APIs: auth, business CRUD, provider CRUD, products CRUD, discovery (provider list with filters), cart/order submit, order status (provider confirm/update), invoice create, payment (Stripe Checkout).
- Implement background job: none critical for MVP except optional “send email on order submitted”. Use sync email send or single worker.
- Frontend: buyer flow (register business, add address, discover providers, view catalog, add to cart, submit order, view orders, pay invoice). Provider flow (register provider, add products, view/confirm orders, update delivery, create invoice).
- Admin: list users/businesses/providers; toggle active/suspended. No analytics.
- Deploy: production env; DB backups; env-based config; no secrets in repo.

### Product goals

- Buyer can complete: sign up → add business + location → find provider → place order → see status → pay invoice.
- Provider can complete: sign up → add catalog → receive order → confirm → mark delivered → create invoice.
- Copy and error messages clear; one currency (e.g. GBP).

### Business goals

- Recruit 5–10 providers and 10–20 buyers for pilot (Phase 4). Contracts or verbal commitment.
- Define “launch” criteria: e.g. 3 providers with 10+ products each; 2 buyers who have placed at least 1 order.

### Validation checkpoints

- [ ] E2E: buyer places order; provider confirms and creates invoice; buyer pays. No manual DB edits.
- [ ] Security: auth required for all relevant endpoints; no cross-tenant data leak.
- [ ] Performance: discovery and order list < 2s p95 on target hardware.
- [ ] Go/no-go for pilot: stable build, no P0 bugs, support contact defined.

---

## Phase 4: Pilot Testing

**Objective:** Run in production with real users; learn and fix.

### Technical goals

- Monitoring: errors (Sentry), basic metrics (request rate, latency, failed payments). Alerts on 5xx and payment failures.
- Fix bugs and performance issues from real usage. Optional: add simple analytics events (order_placed, invoice_paid).
- Optional: in-app notifications (toast or bell) for new order and invoice; email remains primary.

### Product goals

- Onboard pilot buyers and providers; collect feedback on onboarding, discovery, ordering, and payment.
- Measure: orders per week, repeat orders, time to first order, drop-off points.
- Iterate: improve copy, add one or two high-impact filters or validations (e.g. min order, delivery date check).

### Business goals

- Hit MVP success metric (e.g. 20 orders in 4 weeks).
- Decide: continue to scale (Phase 5) or pivot/refine based on feedback.
- Document operational playbook: how to add provider, handle “order not received”, handle payment failure.

### Validation checkpoints

- [ ] At least 50% of pilot buyers place 2+ orders.
- [ ] At least one provider receives 5+ orders through the platform.
- [ ] No critical data loss or security incident.
- [ ] Go/no-go for scaling: unit economics and satisfaction acceptable; roadmap for V1 features agreed.

---

## Phase 5: Scaling

**Objective:** Grow usage and reliability; add V1 features.

### Technical goals

- Add RBAC (multiple users per business/provider); MFA for provider and admin.
- Add availability (delivery windows, service area); validate order against availability.
- Add recurring orders (subscription + job to create orders).
- Add ratings and trust score; show in discovery and profile. Ranking by score.
- Real-time: WebSockets for order and delivery status.
- Invoices: auto-invoice on delivery; optional batch invoice. Stored payment methods; payouts (Stripe Connect).
- Disputes: in-app create, thread, admin resolve and refund.
- Admin: dispute queue, basic analytics, audit log.
- Infrastructure: DB connection pooling; Redis cache for catalog; read replica if needed. Improve observability (traces, business metrics).

### Product goals

- Support team use: invite staff, assign roles. Providers manage availability and see reliability metrics.
- Buyers: recurring orders, trust-based discovery, dispute flow. Fewer support tickets for “where is my order?”
- Admin: resolve disputes and monitor health without DB access.

### Business goals

- Expand to second geography or segment (e.g. more provider types).
- Define and track unit economics: CAC, LTV, take rate, support cost per order.
- Consider first paid marketing or partnerships.

### Validation checkpoints

- [ ] Multiple users per business/provider working; no permission leaks.
- [ ] Recurring orders generate correctly; at least 10% of orders from subscriptions.
- [ ] Disputes resolved in-app; refund flow correct.
- [ ] Uptime and latency within target (e.g. 99.5%, p95 < 1.5s for core APIs).

---

## Phase 6: Monetization

**Objective:** Revenue model live and predictable.

### Technical goals

- Implement take rate: per-order fee or % of GMV; deduct from provider payout. Configurable per provider or plan.
- Optional: subscription plans for providers (listing fee, featured placement). Billing via Stripe Subscriptions.
- Invoicing and reconciliation: platform can invoice providers for fees; payouts net of fees. Reporting for finance.
- No change to buyer flow unless buyer-facing fees (e.g. delivery markup) are introduced.

### Product goals

- Providers see fee and payout breakdown. Optional self-serve plan upgrade.
- Platform dashboard: GMV, revenue (fees), outstanding payouts.

### Business goals

- First paying providers or first month with positive contribution margin.
- Pricing validated: churn and signup rate acceptable after fee introduction.

### Validation checkpoints

- [ ] Fee calculation correct for 100% of pilot payouts (spot check).
- [ ] No double charge or missing payout.
- [ ] Legal and tax review of fee and payout flow (if not done earlier).

---

## Summary Table

| Phase          | Focus                        | Exit condition                            |
| -------------- | ---------------------------- | ----------------------------------------- |
| 1 Concept      | Validation                   | LOI from buyers + providers; go to design |
| 2 Design       | Data model, API, scope, repo | Staging deploy; scope signed off          |
| 3 MVP Build    | End-to-end product           | E2E pass; security check; pilot recruited |
| 4 Pilot        | Real usage, fix, learn       | 20+ orders; playbook; go/no-go scale      |
| 5 Scaling      | V1 features, reliability     | Multi-user, disputes, recurring, payouts  |
| 6 Monetization | Fees, plans, reporting       | Revenue live; reconciliation correct      |
