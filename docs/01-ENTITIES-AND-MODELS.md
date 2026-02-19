# 1. Core System Entities and Data Models

## 1.1 Entity Definitions

### User

Represents a human actor in the system. One user can be linked to multiple businesses or providers via roles.

| Field                  | Type      | Notes                               |
| ---------------------- | --------- | ----------------------------------- |
| id                     | UUID      | PK                                  |
| email                  | string    | unique, indexed                     |
| phone                  | string    | optional, for SMS/2FA               |
| password_hash          | string    | bcrypt/argon2                       |
| first_name, last_name  | string    |                                     |
| avatar_url             | string    | optional                            |
| email_verified_at      | timestamp | nullable                            |
| phone_verified_at      | timestamp | nullable                            |
| status                 | enum      | pending, active, suspended, deleted |
| locale                 | string    | e.g. en_GB                          |
| timezone               | string    | IANA                                |
| created_at, updated_at | timestamp |                                     |

**Constraints:** Email unique. Soft delete via status.

---

### Business (Hospitality Buyer)

The buying entity: restaurant, café, bar, hotel, catering company. One business can have multiple locations and multiple users with different roles.

| Field                       | Type      | Notes                                           |
| --------------------------- | --------- | ----------------------------------------------- |
| id                          | UUID      | PK                                              |
| legal_name                  | string    | registered company name                         |
| trading_name                | string    | display name                                    |
| registration_number         | string    | optional, company reg                           |
| tax_id                      | string    | VAT/tax ID                                      |
| business_type               | enum      | restaurant, cafe, bar, hotel, catering, other   |
| status                      | enum      | pending_verification, active, suspended, closed |
| logo_url                    | string    | optional                                        |
| default_currency            | string    | ISO 4217                                        |
| default_delivery_address_id | UUID      | FK Location, nullable                           |
| created_at, updated_at      | timestamp |                                                 |

**Relations:** has_many Locations, has_many BusinessUsers (roles), has_many Orders (as buyer), has_many PreferredSuppliers, has_many Invoices (as buyer).

---

### Provider (Supplier/Seller)

The selling entity: wholesaler, distributor, roaster, bakery, etc. Can have multiple users, one or more service areas, and a catalog of products/services.

| Field                  | Type      | Notes                                                                                                                     |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| id                     | UUID      | PK                                                                                                                        |
| legal_name             | string    |                                                                                                                           |
| trading_name           | string    |                                                                                                                           |
| registration_number    | string    |                                                                                                                           |
| tax_id                 | string    |                                                                                                                           |
| provider_type          | enum      | food_wholesaler, beverage_distributor, coffee_roaster, bakery, meat_fish, cleaning, equipment, logistics, producer, other |
| status                 | enum      | pending_verification, active, suspended, closed                                                                           |
| logo_url               | string    |                                                                                                                           |
| description            | text      | optional                                                                                                                  |
| default_currency       | string    |                                                                                                                           |
| min_order_value        | decimal   | optional, per order                                                                                                       |
| lead_time_hours        | int       | typical order-to-delivery                                                                                                 |
| service_radius_km      | decimal   | optional, for delivery area                                                                                               |
| created_at, updated_at | timestamp |                                                                                                                           |

**Relations:** has_many ProviderUsers, has_many Locations (warehouses/offices), has_many Products, has_many Services, has_many Availability windows, has_many Orders (as seller), has_many Invoices (as issuer), has_one/many Contracts with Businesses.

---

### Location

Physical address. Used for: business premises, provider warehouses, delivery addresses.

| Field                  | Type      | Notes                                          |
| ---------------------- | --------- | ---------------------------------------------- |
| id                     | UUID      | PK                                             |
| address_line_1         | string    |                                                |
| address_line_2         | string    | optional                                       |
| city                   | string    |                                                |
| region                 | string    | state/county                                   |
| postal_code            | string    |                                                |
| country                | string    | ISO 3166-1 alpha-2                             |
| latitude               | decimal   | for geo/maps                                   |
| longitude              | decimal   |                                                |
| location_type          | enum      | business_premises, warehouse, delivery_address |
| owner_type             | string    | polymorphic: Business, Provider                |
| owner_id               | UUID      |                                                |
| is_default             | boolean   | default false                                  |
| contact_name           | string    | optional                                       |
| contact_phone          | string    | optional                                       |
| delivery_instructions  | text      | optional                                       |
| created_at, updated_at | timestamp |                                                |

**Relations:** belongs_to owner (Business or Provider). Used in Order (delivery_address_id), Availability (service area).

---

### Product

Sellable SKU from a provider (e.g. case of wine, kg of coffee, cleaning product).

| Field                  | Type       | Notes                               |
| ---------------------- | ---------- | ----------------------------------- |
| id                     | UUID       | PK                                  |
| provider_id            | UUID       | FK Provider                         |
| sku                    | string     | provider’s internal SKU             |
| name                   | string     |                                     |
| description            | text       | optional                            |
| category               | string     | e.g. beverages, dry_goods, cleaning |
| unit                   | enum       | kg, litre, case, unit, box, etc.    |
| unit_size              | string     | e.g. "6x75cl" for case              |
| price                  | decimal    | base price in provider currency     |
| currency               | string     |                                     |
| tax_rate               | decimal    | e.g. 0.20 for 20%                   |
| min_order_quantity     | decimal    | optional                            |
| max_order_quantity     | decimal    | optional                            |
| is_active              | boolean    |                                     |
| image_urls             | json/array | optional                            |
| created_at, updated_at | timestamp  |                                     |

**Relations:** belongs_to Provider. Referenced in OrderLine (product_id). Optional: ProductAvailability if stock is exposed.

---

### Service

Non-product offering from a provider (e.g. equipment rental, delivery slot, consultancy). Can be billable per order or subscription.

| Field                  | Type      | Notes                                   |
| ---------------------- | --------- | --------------------------------------- |
| id                     | UUID      | PK                                      |
| provider_id            | UUID      | FK Provider                             |
| name                   | string    |                                         |
| description            | text      | optional                                |
| service_type           | enum      | delivery, rental, subscription, one_off |
| price_type             | enum      | fixed, per_unit, per_order              |
| price                  | decimal   |                                         |
| currency               | string    |                                         |
| unit                   | string    | optional, e.g. per_day, per_delivery    |
| is_active              | boolean   |                                         |
| created_at, updated_at | timestamp |                                         |

**Relations:** belongs_to Provider. Can be attached to Order (e.g. delivery fee) or to Subscription.

---

### Order

A single purchase order from a Business to a Provider. One order = one provider; multiple providers = multiple orders.

| Field                         | Type      | Notes                                                                 |
| ----------------------------- | --------- | --------------------------------------------------------------------- |
| id                            | UUID      | PK                                                                    |
| order_number                  | string    | unique, human-readable (e.g. ORD-2024-00001)                          |
| business_id                   | UUID      | FK Business                                                           |
| provider_id                   | UUID      | FK Provider                                                           |
| delivery_location_id          | UUID      | FK Location                                                           |
| status                        | enum      | draft, submitted, confirmed, preparing, shipped, delivered, cancelled |
| subtotal                      | decimal   | sum of lines before tax                                               |
| tax_total                     | decimal   |                                                                       |
| delivery_fee                  | decimal   | optional                                                              |
| total                         | decimal   |                                                                       |
| currency                      | string    |                                                                       |
| requested_delivery_date       | date      |                                                                       |
| requested_delivery_slot_start | time      | optional                                                              |
| requested_delivery_slot_end   | time      | optional                                                              |
| notes                         | text      | buyer notes                                                           |
| internal_notes                | text      | provider only                                                         |
| submitted_at                  | timestamp | nullable                                                              |
| confirmed_at                  | timestamp | nullable                                                              |
| delivered_at                  | timestamp | nullable                                                              |
| cancellation_reason           | string    | optional                                                              |
| cancelled_at                  | timestamp | nullable                                                              |
| created_at, updated_at        | timestamp |                                                                       |

**Relations:** belongs_to Business, Provider, Location. has_many OrderLines. has_one Delivery (optional). has_one Invoice (after fulfilment or by rule).

---

### OrderLine

Single line item in an order (product or service reference).

| Field                  | Type      | Notes                                      |
| ---------------------- | --------- | ------------------------------------------ |
| id                     | UUID      | PK                                         |
| order_id               | UUID      | FK Order                                   |
| line_type              | enum      | product, service                           |
| product_id             | UUID      | FK Product, nullable                       |
| service_id             | UUID      | FK Service, nullable                       |
| name                   | string    | snapshot of name at order time             |
| quantity               | decimal   |                                            |
| unit                   | string    | snapshot                                   |
| unit_price             | decimal   | snapshot                                   |
| tax_rate               | decimal   |                                            |
| line_total             | decimal   | quantity \* unit_price (incl. tax by rule) |
| created_at, updated_at | timestamp |                                            |

**Constraints:** Exactly one of product_id or service_id set. Snapshot fields for audit.

---

### Delivery

Tracks fulfilment of an order from provider to buyer location.

| Field                  | Type      | Notes                                               |
| ---------------------- | --------- | --------------------------------------------------- |
| id                     | UUID      | PK                                                  |
| order_id               | UUID      | FK Order, unique                                    |
| status                 | enum      | scheduled, picked_up, in_transit, delivered, failed |
| carrier                | string    | optional, provider’s carrier name                   |
| tracking_code          | string    | optional                                            |
| estimated_delivery_at  | timestamp | nullable                                            |
| actual_delivery_at     | timestamp | nullable                                            |
| proof_of_delivery_url  | string    | optional, signature/photo                           |
| notes                  | text      | optional                                            |
| created_at, updated_at | timestamp |                                                     |

**Relations:** belongs_to Order. Can emit events for real-time tracking.

---

### Invoice

Bill issued by provider to business for one or more orders (or subscription). Can be auto-generated on delivery or manual.

| Field                  | Type      | Notes                                   |
| ---------------------- | --------- | --------------------------------------- |
| id                     | UUID      | PK                                      |
| invoice_number         | string    | unique (e.g. INV-2024-00001)            |
| provider_id            | UUID      | FK Provider                             |
| business_id            | UUID      | FK Business                             |
| status                 | enum      | draft, issued, paid, overdue, cancelled |
| subtotal               | decimal   |                                         |
| tax_total              | decimal   |                                         |
| total                  | decimal   |                                         |
| currency               | string    |                                         |
| due_date               | date      |                                         |
| issued_at              | timestamp | nullable                                |
| paid_at                | timestamp | nullable                                |
| created_at, updated_at | timestamp |                                         |

**Relations:** belongs_to Provider, Business. has_many InvoiceLines. has_many Payments (partial payments possible).

---

### InvoiceLine

Links invoice to order or describes ad-hoc charge.

| Field                  | Type      | Notes              |
| ---------------------- | --------- | ------------------ |
| id                     | UUID      | PK                 |
| invoice_id             | UUID      | FK Invoice         |
| order_id               | UUID      | FK Order, nullable |
| description            | string    |                    |
| quantity               | decimal   |                    |
| unit_price             | decimal   |                    |
| line_total             | decimal   |                    |
| created_at, updated_at | timestamp |                    |

---

### Payment

A payment made (or attempted) against an invoice or order.

| Field                  | Type      | Notes                                            |
| ---------------------- | --------- | ------------------------------------------------ |
| id                     | UUID      | PK                                               |
| payable_type           | string    | polymorphic: Invoice, Order (for pay-on-order)   |
| payable_id             | UUID      |                                                  |
| business_id            | UUID      | FK Business (payer)                              |
| amount                 | decimal   |                                                  |
| currency               | string    |                                                  |
| status                 | enum      | pending, processing, completed, failed, refunded |
| method                 | enum      | card, bank_transfer, platform_balance, etc.      |
| external_id            | string    | payment gateway reference                        |
| metadata               | json      | gateway-specific                                 |
| paid_at                | timestamp | nullable                                         |
| created_at, updated_at | timestamp |                                                  |

**Relations:** belongs_to payable (Invoice or Order), Business. Refunds as separate Payment with negative amount or Refund entity linking to original.

---

### Availability

When and where a provider accepts orders (e.g. delivery windows, service area).

| Field                  | Type       | Notes                                     |
| ---------------------- | ---------- | ----------------------------------------- |
| id                     | UUID       | PK                                        |
| provider_id            | UUID       | FK Provider                               |
| availability_type      | enum       | delivery_window, collection, service_area |
| day_of_week            | int        | 0–6 (Sun–Sat), nullable for one-off       |
| start_time             | time       |                                           |
| end_time               | time       |                                           |
| valid_from             | date       | optional                                  |
| valid_until            | date       | optional                                  |
| region_postcodes       | json/array | optional, list of postcodes               |
| radius_km              | decimal    | optional, from provider base              |
| is_active              | boolean    |                                           |
| created_at, updated_at | timestamp  |                                           |

**Relations:** belongs_to Provider. Used by discovery and order validation.

---

### Rating / Trust

Review or score from a business about a provider (order-level or aggregate).

| Field                  | Type      | Notes                                                 |
| ---------------------- | --------- | ----------------------------------------------------- |
| id                     | UUID      | PK                                                    |
| order_id               | UUID      | FK Order                                              |
| business_id            | UUID      | FK Business                                           |
| provider_id            | UUID      | FK Provider                                           |
| rating                 | int       | 1–5                                                   |
| dimensions             | json      | optional: quality, delivery_time, communication, etc. |
| comment                | text      | optional                                              |
| is_visible             | boolean   | default true                                          |
| created_at, updated_at | timestamp |                                                       |

**Relations:** belongs_to Order, Business, Provider. One rating per order. Aggregates (average, count) computed or materialized for Provider.

---

### Subscription / Plan

Recurring order or subscription plan (e.g. weekly milk delivery).

| Field                  | Type      | Notes                            |
| ---------------------- | --------- | -------------------------------- |
| id                     | UUID      | PK                               |
| business_id            | UUID      | FK Business                      |
| provider_id            | UUID      | FK Provider                      |
| plan_name              | string    | optional                         |
| frequency              | enum      | daily, weekly, biweekly, monthly |
| next_order_date        | date      |                                  |
| delivery_location_id   | UUID      | FK Location                      |
| status                 | enum      | active, paused, cancelled        |
| created_at, updated_at | timestamp |                                  |

**Relations:** has_many SubscriptionLines (product_id, quantity). Order generation job creates Order from Subscription when next_order_date is due.

---

### Contract / Agreement

Formal or legal agreement between business and provider (e.g. terms, credit limit, pricing agreement).

| Field                  | Type      | Notes                                          |
| ---------------------- | --------- | ---------------------------------------------- |
| id                     | UUID      | PK                                             |
| business_id            | UUID      | FK Business                                    |
| provider_id            | UUID      | FK Provider                                    |
| contract_type          | enum      | framework, credit_agreement, pricing_agreement |
| status                 | enum      | draft, active, expired, terminated             |
| valid_from             | date      |                                                |
| valid_until            | date      | nullable                                       |
| document_url           | string    | optional, signed PDF                           |
| metadata               | json      | credit_limit, payment_terms_days, etc.         |
| created_at, updated_at | timestamp |                                                |

**Relations:** belongs_to Business, Provider. Optional: used to enforce payment terms or pricing.

---

### PreferredSupplier

Business’s saved/shortlisted provider (no formal contract required).

| Field                  | Type      | Notes       |
| ---------------------- | --------- | ----------- |
| id                     | UUID      | PK          |
| business_id            | UUID      | FK Business |
| provider_id            | UUID      | FK Provider |
| notes                  | text      | optional    |
| created_at, updated_at | timestamp |             |

**Relations:** belongs_to Business, Provider. Unique (business_id, provider_id).

---

## 1.2 Entity Relationship Summary

```
User ──< BusinessUser >── Business
User ──< ProviderUser  >── Provider

Business ──< Location (premises, delivery addresses)
Provider  ──< Location (warehouses)
Provider  ──< Product
Provider  ──< Service
Provider  ──< Availability

Business ──< Order >── Provider
Order    ──< OrderLine >── Product / Service
Order    ── Delivery (1:1)
Order    ── Invoice (1:1 or N:1 depending on invoicing rule)
Order    ── Rating (0..1)

Business ──< Invoice >── Provider
Invoice  ──< InvoiceLine >── Order (optional)
Invoice  ──< Payment

Business ──< PreferredSupplier >── Provider
Business ──< Subscription >── Provider
Business ──< Contract >── Provider
```

---

## 1.3 Key Relationships in Plain Terms

- **User ↔ Business / Provider:** Many-to-many via role tables (BusinessUser, ProviderUser) with role (owner, admin, staff, viewer) and permissions.
- **Order:** Always one Business, one Provider, one delivery Location. Order lines reference Products/Services with snapshotted prices.
- **Invoice:** Typically one per order for MVP; later, one invoice can aggregate multiple orders (e.g. weekly statement).
- **Delivery:** One per Order; status drives buyer-facing tracking and provider workflow.
- **Availability:** Defines where and when a provider can deliver; used for discovery and for validating requested delivery date/slot.
- **Rating:** One per Order, from Business to Provider; feeds trust/reliability metrics.
- **Subscription:** Generates recurring Orders on a schedule; each generated order is a normal Order linked back to the subscription.
