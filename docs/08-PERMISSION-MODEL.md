# PERMISSION MODEL

## Roles, Access, Control & Authority

---

## 1) System Roles

Roles are permission sets. A user is assigned one role per context (per Business or per Provider). Same user can hold different roles in different contexts. Platform roles are global and not tied to a Business or Provider.

### Buyer Side

| Role            | Identifier         | Description                                                                                                               |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| BusinessOwner   | `business_owner`   | Full control over the business entity, billing, and membership. Single primary owner per business.                        |
| BusinessManager | `business_manager` | Full operational control; cannot delete business, change primary billing, or remove owner.                                |
| BusinessStaff   | `business_staff`   | Can place orders, view orders and invoices, manage delivery addresses within the business. No user or billing management. |

### Provider Side

| Role            | Identifier         | Description                                                                                        |
| --------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| ProviderOwner   | `provider_owner`   | Full control over the provider entity, payouts, and membership. Single primary owner per provider. |
| ProviderManager | `provider_manager` | Full operational control; cannot delete provider, change payout account, or remove owner.          |
| ProviderStaff   | `provider_staff`   | Can manage catalog, fulfil orders, update delivery status. No user, billing, or payout management. |

### Platform Side

| Role            | Identifier         | Description                                                                                                                                               |
| --------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PlatformAdmin   | `platform_admin`   | Full platform control: config, feature flags, all data access, role assignment, system parameters.                                                        |
| PlatformOps     | `platform_ops`     | Operational access: verification workflows, dispute handling, user/business/provider status, no financial execution.                                      |
| PlatformFinance | `platform_finance` | Financial access: payouts, refunds, payment routing, reconciliation, invoice/payment data. No verification or dispute resolution.                         |
| PlatformSupport | `platform_support` | Read-only plus limited actions: view user/business/provider/order data, trigger password reset, escalate to Ops. No status changes, no financial actions. |

### System Roles (Non-Human / External)

| Role             | Identifier          | Description                                                                                                                                                                                                   |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LogisticsAgent   | `logistics_agent`   | System or integration identity that can update Delivery status and tracking for assigned orders. No access to order line items, pricing, or payer data.                                                       |
| PaymentProcessor | `payment_processor` | External payment gateway webhook or batch identity. Can write Payment status and external_id; can read minimal order/invoice data required for reconciliation. Cannot read other payments or platform config. |

---

## 2) Access Scopes

Scopes define the boundary of data and operations. Every permission is evaluated within a scope. Request context must resolve to exactly one primary scope for the operation.

### Personal scope

- **Boundary:** Data and operations that belong to the authenticated user only.
- **Includes:** User profile (email, name, phone, preferences), notification preferences, session list, linked business/provider memberships (list only, not entity data).
- **Excludes:** Any Business or Provider entity data; any Order, Invoice, Payment content.

### Business scope

- **Boundary:** Data and operations owned by or attributed to one Business entity.
- **Includes:** Business profile, Locations of that business, Orders where business_id = X, Invoices where business_id = X, Payments made by that business, PreferredSuppliers for that business, Subscriptions, Contract records where business_id = X, Ratings issued by that business.
- **Resolved by:** business_id from request (path, body, or session after role resolution). User must have a role on that business to access.

### Provider scope

- **Boundary:** Data and operations owned by or attributed to one Provider entity.
- **Includes:** Provider profile, Locations, Products, Services, Availability, Orders where provider_id = X, Invoices issued by that provider, Delivery records for those orders, Ratings received by that provider, Contracts where provider_id = X.
- **Resolved by:** provider_id from request. User must have a role on that provider to access.

### Platform scope

- **Boundary:** Cross-tenant and system configuration.
- **Includes:** All users, all businesses, all providers, all orders/invoices/payments/deliveries, verification queues, dispute records, payout runs, feature flags, ranking/trust parameters, audit logs.
- **Resolved by:** Platform role presence. No business_id or provider_id required for platform operations.

### Transaction scope

- **Boundary:** A single transaction (Order, Invoice, Payment, Delivery) and its direct participants.
- **Used for:** PaymentProcessor and LogisticsAgent. Access is limited to the specific resource ID and the minimal fields required for the operation (e.g. order total, currency, delivery status). No cross-transaction queries.

### Analytics scope

- **Boundary:** Aggregated or anonymised data for reporting.
- **Includes:** Counts, sums, trends (e.g. orders per day, GMV per provider), provider ranking inputs (scores, not raw ratings), trust metrics. No PII or direct identifiers in analytics outputs for non-Platform roles.
- **Rule:** Buyer sees only analytics for their Business scope; Provider sees only analytics for their Provider scope; Platform sees global analytics. Raw event streams are Platform-only.

---

## 3) Permissions per Role

Permissions are expressed as `scope:resource:action`. Default is deny. Only explicitly granted actions are allowed.

### Convention

- **read:** GET/list, view resource and permitted fields.
- **write:** CREATE, UPDATE (including state transitions). Delete where applicable.
- **manage:** Administrative actions on the resource or its container (e.g. invite user, change role, delete).
- **financial:** Initiate or approve payments, refunds, payouts, view full financial details.
- **visibility:** Control who else can see the resource (e.g. publish catalog, set business discoverable). Does not grant read of other scopes.

---

### Buyer Side

#### BusinessOwner

| Category   | Scope    | Resource           | Action              | Notes                                                                |
| ---------- | -------- | ------------------ | ------------------- | -------------------------------------------------------------------- |
| read       | personal | user               | read                | Own profile.                                                         |
| write      | personal | user               | write               | Own profile, password, MFA.                                          |
| read       | business | business           | read                | Full business profile.                                               |
| write      | business | business           | write               | All business fields, status (except delete if primary).              |
| manage     | business | business           | delete              | Only if single owner and no outstanding obligations.                 |
| read       | business | location           | read                | Locations of this business.                                          |
| write      | business | location           | write               | Add, edit, delete delivery addresses.                                |
| read       | business | order              | read                | Orders of this business.                                             |
| write      | business | order              | write               | Create order, cancel (within policy).                                |
| read       | business | invoice            | read                | Invoices to this business.                                           |
| write      | business | invoice            | write               | No (invoices issued by provider).                                    |
| read       | business | payment            | read                | Payments made by this business.                                      |
| write      | business | payment            | write               | Initiate payment (pay invoice).                                      |
| read       | business | preferred_supplier | read                | This business’s list.                                                |
| write      | business | preferred_supplier | write               | Add, remove.                                                         |
| read       | business | subscription       | read                | This business’s subscriptions.                                       |
| write      | business | subscription       | write               | Create, update, pause, cancel.                                       |
| read       | business | contract           | read                | Contracts involving this business.                                   |
| write      | business | contract           | write               | Sign/accept only; creation by provider or platform.                  |
| read       | business | rating             | read                | Ratings this business gave.                                          |
| write      | business | rating             | write               | Submit rating for own orders.                                        |
| manage     | business | business_user      | read, write, delete | Invite, change role, remove. Owner cannot demote self if sole owner. |
| financial  | business | business           | read_billing        | Billing contact, payment methods.                                    |
| financial  | business | payment            | read, write         | Full payment details for this business.                              |
| visibility | business | business           | set_visibility      | Whether business can be used in discovery (if ever applicable).      |

#### BusinessManager

| Category   | Scope    | Resource                         | Action                     | Notes                                                   |
| ---------- | -------- | -------------------------------- | -------------------------- | ------------------------------------------------------- |
| read       | personal | user                             | read                       | Own profile.                                            |
| write      | personal | user                             | write                      | Own profile, password.                                  |
| read       | business | business                         | read                       | Full business profile.                                  |
| write      | business | business                         | write                      | All except delete, primary billing handover.            |
| read       | business | location                         | read, write                | Same as owner.                                          |
| read       | business | order                            | read, write                | Same as owner.                                          |
| read       | business | invoice                          | read                       | Same as owner.                                          |
| read       | business | payment                          | read                       | Same as owner.                                          |
| write      | business | payment                          | write                      | Initiate payment.                                       |
| read/write | business | preferred_supplier, subscription | read, write                | Same as owner (no delete business).                     |
| read       | business | contract                         | read                       | Same as owner.                                          |
| read/write | business | rating                           | read, write                | Same as owner.                                          |
| manage     | business | business_user                    | read, write, delete        | Cannot remove owner; cannot assign owner role.          |
| financial  | business | payment                          | read, write                | Same as owner.                                          |
| **Denied** | business | business                         | delete, transfer_ownership | Manager cannot delete business or change primary owner. |

#### BusinessStaff

| Category   | Scope    | Resource                                  | Action      | Notes                                                      |
| ---------- | -------- | ----------------------------------------- | ----------- | ---------------------------------------------------------- |
| read       | personal | user                                      | read        | Own profile.                                               |
| write      | personal | user                                      | write       | Own profile, password.                                     |
| read       | business | business                                  | read        | Name, default address, currency only.                      |
| read       | business | location                                  | read        | Delivery addresses.                                        |
| write      | business | location                                  | write       | Add, edit (non-primary only if constrained by policy).     |
| read       | business | order                                     | read, write | View and create/cancel orders.                             |
| read       | business | invoice                                   | read        | View only.                                                 |
| read       | business | payment                                   | read        | View payment status only (no full payment method details). |
| write      | business | payment                                   | write       | Initiate payment (e.g. pay invoice).                       |
| read       | business | preferred_supplier                        | read, write | Add/remove from list.                                      |
| read       | business | subscription                              | read        | View only.                                                 |
| write      | business | subscription                              | write       | No (manager/owner only) or limited (e.g. pause only).      |
| read       | business | rating                                    | read, write | View and submit ratings.                                   |
| **Denied** | business | business_user, contract, business billing | all         | No user management, no contract or billing access.         |

---

### Provider Side

#### ProviderOwner

| Category   | Scope    | Resource         | Action              | Notes                                                          |
| ---------- | -------- | ---------------- | ------------------- | -------------------------------------------------------------- |
| read       | personal | user             | read, write         | Own profile.                                                   |
| read       | provider | provider         | read, write         | Full provider profile.                                         |
| manage     | provider | provider         | delete              | Only under platform policy (e.g. no open orders).              |
| read       | provider | location         | read, write         | Provider’s locations.                                          |
| read       | provider | product, service | read, write         | Full catalog.                                                  |
| read       | provider | availability     | read, write         | Delivery windows, service area.                                |
| read       | provider | order            | read, write         | Orders to this provider; confirm, reject, set status.          |
| read       | provider | delivery         | read, write         | Update delivery status, tracking.                              |
| read       | provider | invoice          | read, write         | Create, issue, cancel draft.                                   |
| read       | provider | rating           | read                | Ratings received.                                              |
| read       | provider | contract         | read, write         | Create/update contracts with businesses.                       |
| manage     | provider | provider_user    | read, write, delete | Invite, change role, remove. Cannot demote self if sole owner. |
| financial  | provider | payment          | read                | Payout history, balances (via platform).                       |
| financial  | provider | invoice          | read                | Full invoice and payment linkage.                              |
| visibility | provider | provider         | set_visibility      | Catalog and discovery visibility.                              |
| visibility | provider | product, service | set_active          | Publish/unpublish catalog items.                               |

#### ProviderManager

| Category   | Scope    | Resource                                 | Action                 | Notes                                       |
| ---------- | -------- | ---------------------------------------- | ---------------------- | ------------------------------------------- |
| read       | personal | user                                     | read, write            | Own profile.                                |
| read       | provider | provider                                 | read, write            | All except delete, payout account.          |
| read       | provider | location, product, service, availability | read, write            | Same as owner.                              |
| read       | provider | order, delivery                          | read, write            | Same as owner.                              |
| read       | provider | invoice                                  | read, write            | Same as owner.                              |
| read       | provider | rating, contract                         | read                   | Same as owner (no contract write).          |
| manage     | provider | provider_user                            | read, write, delete    | Cannot remove owner; cannot assign owner.   |
| financial  | provider | invoice                                  | read                   | Same as owner.                              |
| **Denied** | provider | provider                                 | delete, payout_account | No delete; no change of payout destination. |

#### ProviderStaff

| Category   | Scope    | Resource                        | Action      | Notes                                            |
| ---------- | -------- | ------------------------------- | ----------- | ------------------------------------------------ |
| read       | personal | user                            | read, write | Own profile.                                     |
| read       | provider | provider                        | read        | Name, status, basic info.                        |
| read       | provider | location                        | read        | Warehouse/delivery points.                       |
| read       | provider | product, service                | read, write | Catalog CRUD.                                    |
| read       | provider | availability                    | read        | View only.                                       |
| write      | provider | availability                    | write       | Optional: allow staff to update (policy choice). |
| read       | provider | order                           | read, write | View and update order/delivery status.           |
| read       | provider | delivery                        | read, write | Update status, tracking.                         |
| read       | provider | invoice                         | read        | View only.                                       |
| write      | provider | invoice                         | write       | Create/issue only (no delete) if policy allows.  |
| read       | provider | rating                          | read        | View only.                                       |
| **Denied** | provider | provider_user, contract, payout | all         | No user management, contracts, or payout data.   |

---

### Platform Side

#### PlatformAdmin

| Category  | Scope    | Resource                               | Action               | Notes                                                |
| --------- | -------- | -------------------------------------- | -------------------- | ---------------------------------------------------- |
| all       | platform | user, business, provider               | read, write, delete  | Full CRUD, status, verification.                     |
| all       | platform | order, invoice, payment, delivery      | read, write          | Override status where needed for support.            |
| all       | platform | dispute                                | read, write, resolve | Full dispute handling.                               |
| all       | platform | config, feature_flag                   | read, write          | System and feature configuration.                    |
| all       | platform | ranking, trust_score, visibility_rules | read, write          | Algorithm and rule parameters.                       |
| all       | platform | audit_log                              | read                 | Full audit.                                          |
| all       | platform | platform_user                          | read, write, delete  | Assign platform roles.                               |
| financial | platform | payout, refund                         | read, write          | Can execute; typically delegated to PlatformFinance. |

#### PlatformOps

| Category   | Scope    | Resource                                                | Action               | Notes                                                                      |
| ---------- | -------- | ------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------- |
| read       | platform | user, business, provider                                | read, write          | Status change (suspend, activate); verification approve/reject. No delete. |
| read       | platform | order, delivery                                         | read, write          | Status override for operational fix.                                       |
| read       | platform | dispute                                                 | read, write, resolve | Full dispute workflow.                                                     |
| read       | platform | audit_log                                               | read                 | For investigation.                                                         |
| **Denied** | platform | payment, payout, refund, config, ranking, platform_user | write                | No financial execution; no system config; no role assignment.              |

#### PlatformFinance

| Category   | Scope    | Resource                                                                   | Action      | Notes                                        |
| ---------- | -------- | -------------------------------------------------------------------------- | ----------- | -------------------------------------------- |
| read       | platform | business, provider                                                         | read        | For payment context.                         |
| read       | platform | order, invoice, payment                                                    | read        | Full financial data.                         |
| financial  | platform | payment, payout, refund                                                    | read, write | Execute refunds, trigger payouts, reconcile. |
| read       | platform | dispute                                                                    | read        | For refund linkage.                          |
| **Denied** | platform | user status, verification, dispute resolve, config, ranking, platform_user | write       | No ops or admin actions.                     |

#### PlatformSupport

| Category   | Scope    | Resource                                                             | Action | Notes                                                 |
| ---------- | -------- | -------------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| read       | platform | user, business, provider                                             | read   | View only.                                            |
| read       | platform | order, invoice, payment, delivery                                    | read   | View only.                                            |
| write      | platform | user                                                                 | write  | Limited: trigger password reset, resend verification. |
| read       | platform | dispute                                                              | read   | View only; escalate to Ops.                           |
| **Denied** | platform | any status change, financial execution, config, audit_log (optional) | write  | No status changes; no payments; no config.            |

---

### System Roles (External)

#### LogisticsAgent

| Category   | Scope       | Resource                                                     | Action | Notes                                                                                       |
| ---------- | ----------- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| read       | transaction | delivery                                                     | read   | Only delivery record for assigned order(s).                                                 |
| write      | transaction | delivery                                                     | write  | status, tracking_code, estimated_delivery_at, actual_delivery_at.                           |
| **Denied** | all         | order (lines, pricing), invoice, payment, business, provider | read   | No access to order content or parties beyond delivery address (if required for fulfilment). |

#### PaymentProcessor

| Category   | Scope       | Resource                                         | Action      | Notes                                                    |
| ---------- | ----------- | ------------------------------------------------ | ----------- | -------------------------------------------------------- |
| read       | transaction | order, invoice                                   | read        | Minimal: id, total, currency, payable_id for webhook.    |
| write      | transaction | payment                                          | write       | status, external_id, paid_at. Idempotent by external_id. |
| **Denied** | all         | user, business, provider profile, other payments | read, write | No PII; no cross-transaction queries.                    |

---

## 4) Authority Boundaries

Hard boundaries that the system must enforce. Violations must be rejected regardless of role if the condition is met.

### Cross-tenant isolation

- A user with only Buyer roles **cannot** access any Provider-scoped data (catalog, orders as seller, provider profile) except the public discovery view (see Data Visibility).
- A user with only Provider roles **cannot** access any Business-scoped data (other than orders where provider_id = their provider; and contract counterparty business only as permitted).
- No role may query or list resources for a business_id or provider_id they are not linked to, except Platform roles with platform scope.

### Immutable boundaries

- **Order line items and totals:** After order status moves from `draft` to `submitted`, order lines and monetary fields are immutable. Only status, delivery, and internal_notes (provider) can change. Platform can correct in exceptional cases with audit.
- **Payment record:** Once payment status = `completed`, the amount and payable_id are immutable. Only refund creates a new record or linked refund entity.
- **Audit log:** Append-only. No role can update or delete audit entries. PlatformAdmin can read only.

### Role isolation

- **BusinessOwner** is the only role that can transfer primary ownership or delete the business (subject to policy). BusinessManager cannot grant or revoke BusinessOwner.
- **ProviderOwner** is the only role that can change payout account or delete the provider. ProviderManager cannot grant or revoke ProviderOwner.
- **PlatformFinance** cannot change user/business/provider status or resolve disputes. **PlatformOps** cannot execute payments or payouts. Separation is mandatory.
- **LogisticsAgent** and **PaymentProcessor** cannot assume any Buyer, Provider, or Platform role. They are identified by system credentials or webhook signatures, not user session.

### Forbidden cross-role data access

- Buyer roles **cannot** read: provider cost/payout data, other businesses’ orders or invoices, platform ranking weights, raw rating distribution of a provider beyond the displayed score.
- Provider roles **cannot** read: other providers’ catalogs or prices, other providers’ order volume, business payment methods or full payment history beyond “paid/unpaid” for their own invoices.
- PlatformSupport **cannot** read: audit log (unless explicitly granted for a subset), feature flags, ranking parameters.
- **No shared authority:** No operation requires two distinct roles to approve (e.g. no “Finance + Ops” dual approval in MVP). Single role per action. Dual approval can be added as a separate control point later.

---

## 5) Data Visibility Rules

### Buyers (Business scope)

- **Visible:** Own business profile and locations; orders where business_id = self; invoices and payments for those orders; preferred suppliers (list and provider public profile); subscriptions; contracts where business is party; ratings they submitted; provider public discovery data (trading name, rating, delivery info, catalog for discovery).
- **Not visible:** Other businesses’ data; provider internal data (costs, payouts, other buyers); raw ranking inputs; other businesses’ orders or spend; platform config or audit.

### Providers (Provider scope)

- **Visible:** Own provider profile, locations, catalog, availability; orders where provider_id = self (including buyer trading name and delivery address for fulfilment); invoices they issued and payment status; delivery records; ratings they received (aggregate and list); contracts where provider is party; own payout history.
- **Not visible:** Other providers’ catalogs, prices, or orders; business payment methods or full payment history beyond “invoice paid”; other providers’ ratings or trust score inputs; platform ranking formula; platform config or audit.

### Platform

- **PlatformAdmin:** Full visibility of all entities and config.
- **PlatformOps:** Full visibility of user, business, provider, order, delivery, dispute; no visibility of payment method details or payout account numbers (only status and amounts).
- **PlatformFinance:** Full visibility of order, invoice, payment, payout; visibility of business/provider only as needed for payment context (e.g. legal name, payout account for provider).
- **PlatformSupport:** Visibility of user, business, provider, order, invoice, delivery (no payment method details); dispute view only.

### External systems

- **LogisticsAgent:** Only delivery entity for the order(s) it is authorised to update. Optional: delivery address (no business name if policy restricts).
- **PaymentProcessor:** Only the payment record and the minimal order/invoice fields required for webhook (id, amount, currency). No PII, no other payments.

### Forbidden visibility cases

- **Never expose to any role:** Passwords, token secrets, full card numbers, other tenants’ PII in bulk export.
- **Never expose to Buyer:** Provider’s cost price, provider’s other customers, platform fee or commission.
- **Never expose to Provider:** Buyer’s payment method details, other providers’ performance or catalog.
- **Never expose to Support:** Audit log (unless scoped), feature flags, ranking parameters.
- **Never expose to PaymentProcessor/LogisticsAgent:** Any resource outside the single transaction they are acting on.

---

## 6) Control Points

Control points are system capabilities that affect trust, money, or visibility. Only designated roles can read or modify them. All changes must be audited.

| Control point            | Description                                                                                 | Read                                                         | Write                          | Audit |
| ------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------ | ----- |
| Ranking algorithm        | Weights and rules for provider order in discovery (e.g. rating, distance, reliability).     | PlatformAdmin, PlatformOps (optional)                        | PlatformAdmin                  | Yes   |
| Trust score              | Formula and inputs for provider trust score.                                                | PlatformAdmin                                                | PlatformAdmin                  | Yes   |
| Visibility rules         | Which providers appear in discovery (status, verification, min rating, blocklist).          | PlatformAdmin, PlatformOps                                   | PlatformAdmin                  | Yes   |
| Recommendation system    | Any logic that surfaces “recommended” or “featured” providers.                              | PlatformAdmin                                                | PlatformAdmin                  | Yes   |
| Dispute resolution       | Who can resolve (PlatformOps, PlatformAdmin); resolution types (refund full/partial/close). | PlatformOps, PlatformAdmin                                   | PlatformOps, PlatformAdmin     | Yes   |
| Payment routing          | How funds flow (e.g. Stripe Connect account mapping, hold period).                          | PlatformAdmin, PlatformFinance                               | PlatformAdmin, PlatformFinance | Yes   |
| Payout execution         | Triggering payouts, minimums, schedule.                                                     | PlatformFinance                                              | PlatformFinance                | Yes   |
| Refund execution         | Initiating refunds (platform or provider).                                                  | PlatformFinance, ProviderOwner (own payouts only if allowed) | PlatformFinance                | Yes   |
| Verification             | Approve/reject business or provider; set verification level.                                | PlatformOps, PlatformAdmin                                   | PlatformOps, PlatformAdmin     | Yes   |
| Feature flags            | Enable/disable features per segment.                                                        | PlatformAdmin                                                | PlatformAdmin                  | Yes   |
| Rate limits / throttling | API or per-tenant limits.                                                                   | PlatformAdmin                                                | PlatformAdmin                  | Yes   |

---

## 7) Permission Design Rules

### Default deny

- Every request is denied unless a rule explicitly grants the action for the resolved (user, role, scope, resource, action). No implicit allow.
- Missing role or missing permission returns 403. Unauthenticated returns 401.

### Least privilege

- Each role is granted the minimum set of permissions required for its function. No “super” role for non-Platform users.
- New features add explicit permissions; no blanket “read all” or “write all” for tenant roles.

### Scope isolation

- Every API request that operates on business or provider data must resolve scope from the authenticated context: (user_id → business_id or provider_id via BusinessUser/ProviderUser). The resource’s business_id or provider_id must match the resolved scope.
- Query filters (e.g. WHERE business_id = :resolved_business_id) are applied in the data layer, not only in the API layer.

### Auditability

- All state-changing actions (write, financial, manage, control point changes) must write to an audit log: who (user_id, role), what (resource type, id, action), when (timestamp), outcome (success/failure), and optional before/after for sensitive fields.
- Audit log is append-only and readable only by PlatformAdmin (and optionally PlatformOps for investigations).

### Traceability

- Every order, invoice, and payment must be traceable to the acting user (or system role) and timestamp. No anonymous writes.
- Payment and payout records must reference the idempotency key or idempotent request id used for the external call.

### Role separation

- Platform roles are distinct: Admin (config, full access), Ops (verification, disputes), Finance (money movement), Support (read + limited user actions). No single platform role has both “change user status” and “execute payout” unless explicitly designed (e.g. PlatformAdmin with audit).
- Buyer and Provider roles are separate; a user can hold both but each context is evaluated independently.

### No shared authority

- One role suffices to perform an allowed action. No requirement for two roles to concur for a single operation in the base model. Optional: add approval workflows later as separate features with their own permissions.

### Implementation notes

- Store permissions as (role_id, scope, resource, action) or derive from role → permission set in code. Prefer table-driven permission checks so changes do not require code deploy.
- Resolve (user, business_id or provider_id, role) once per request; attach to request context. Use the same context for data access and audit.
- Validate scope on every request: path/body resource ids must belong to the resolved scope. Return 404 (not 403) when the resource does not exist in scope to avoid leaking existence.
