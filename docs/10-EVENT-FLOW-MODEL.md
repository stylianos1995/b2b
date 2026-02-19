# EVENT FLOW MODEL

## Distributed event flow and failure handling

---

## 1) Core Events

| Event                | Description                                                                 | Payload (minimal)                                                    |
| -------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **UserRegistered**   | A new user account was created (post signup).                               | user_id, email, registered_at                                        |
| **BusinessCreated**  | A new business entity was created and persisted.                            | business_id, owner_user_id, created_at                               |
| **ProviderVerified** | Provider status transitioned to active (e.g. after admin verification).     | provider_id, verified_at                                             |
| **ProductCreated**   | A new product was added to a provider catalog.                              | product_id, provider_id, created_at                                  |
| **OrderPlaced**      | Order was submitted (state moved from draft to submitted).                  | order_id, business_id, provider_id, submitted_at                     |
| **OrderConfirmed**   | Provider confirmed the order (state moved to confirmed).                    | order_id, business_id, provider_id, confirmed_at                     |
| **OrderPrepared**    | Order state moved to preparing (e.g. being picked/packed).                  | order_id, provider_id, at                                            |
| **OrderDispatched**  | Order was marked shipped / dispatched (order state or delivery in transit). | order_id, business_id, provider_id, at                               |
| **OrderDelivered**   | Delivery was marked delivered (delivery status = delivered).                | order_id, delivery_id, business_id, provider_id, delivered_at        |
| **InvoiceGenerated** | Invoice was created and issued (linked to order(s) or ad-hoc).              | invoice_id, provider_id, business_id, order_ids[], issued_at         |
| **PaymentInitiated** | A payment was started (e.g. redirect to gateway or intent created).         | payment_id, payable_type, payable_id, amount, currency, initiated_at |
| **PaymentCompleted** | Payment reached completed status (funds captured).                          | payment_id, payable_type, payable_id, amount, paid_at                |
| **PayoutExecuted**   | A payout to a provider was executed by the platform.                        | payout_id, provider_id, amount, currency, executed_at                |
| **RatingSubmitted**  | A buyer submitted a rating for an order.                                    | rating_id, order_id, business_id, provider_id, rating, submitted_at  |
| **DisputeOpened**    | A dispute was created for an order.                                         | dispute_id, order_id, business_id, provider_id, opened_at            |
| **DisputeResolved**  | Dispute was closed with a resolution (refund full/partial/none).            | dispute_id, order_id, resolution_type, resolved_at                   |

All events include: `event_id` (unique), `event_type`, `schema_version`, `producer_service`, `occurred_at` (UTC). Optional: `correlation_id`, `causation_id` for traceability.

---

## 2) Event Producers

| Event            | Producer service  | When emitted                                                                                                  |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| UserRegistered   | Identity Service  | After user record is persisted and (if applicable) email verification is triggered.                           |
| BusinessCreated  | Business Service  | After Business record is created and committed.                                                               |
| ProviderVerified | Provider Service  | When provider status transitions to `active` (e.g. after admin approval via Provider API).                    |
| ProductCreated   | Provider Service  | After Product record is created and committed. Same pattern for ProductUpdated, ProductDeactivated if needed. |
| OrderPlaced      | Order Service     | After order state transitions to `submitted` and transaction is committed.                                    |
| OrderConfirmed   | Order Service     | After order state transitions to `confirmed`.                                                                 |
| OrderPrepared    | Order Service     | After order state transitions to `preparing`.                                                                 |
| OrderDispatched  | Order Service     | After order state transitions to `shipped` (provider marked as dispatched).                                   |
| OrderDelivered   | Logistics Service | After Delivery record status is set to `delivered` and committed.                                             |
| InvoiceGenerated | Payment Service   | After invoice is created and status set to `issued`.                                                          |
| PaymentInitiated | Payment Service   | When payment record is created and charge/intent is initiated (optional event).                               |
| PaymentCompleted | Payment Service   | When payment status is set to `completed` (e.g. from webhook or sync callback).                               |
| PayoutExecuted   | Payment Service   | After payout to provider is executed and recorded.                                                            |
| RatingSubmitted  | Trust Service     | After Rating record is persisted.                                                                             |
| DisputeOpened    | Admin Service     | After Dispute record is created.                                                                              |
| DisputeResolved  | Admin Service     | After dispute status is set to resolved and resolution is recorded.                                           |

Only the service that owns the entity and performs the state change emits the corresponding event. No other service may emit that event.

---

## 3) Event Consumers

| Event            | Consumer service | Action                                                                                                                       |
| ---------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| UserRegistered   | Notification     | Send welcome / verification email.                                                                                           |
| UserRegistered   | Analytics        | Record signup event.                                                                                                         |
| BusinessCreated  | Analytics        | Record business creation.                                                                                                    |
| ProviderVerified | Notification     | Optional: notify provider.                                                                                                   |
| ProviderVerified | Search/Discovery | Include or update provider in discovery index.                                                                               |
| ProviderVerified | Analytics        | Record verification.                                                                                                         |
| ProductCreated   | Search/Discovery | Add or update product in search index.                                                                                       |
| ProductCreated   | Analytics        | Optional: catalog metrics.                                                                                                   |
| OrderPlaced      | Notification     | Notify provider (new order).                                                                                                 |
| OrderPlaced      | Analytics        | Record order placed.                                                                                                         |
| OrderConfirmed   | Notification     | Notify buyer (order confirmed).                                                                                              |
| OrderConfirmed   | Logistics        | Create Delivery record for order_id (if not already created).                                                                |
| OrderConfirmed   | Analytics        | Record confirmation.                                                                                                         |
| OrderPrepared    | Notification     | Optional: notify buyer.                                                                                                      |
| OrderPrepared    | Analytics        | Record state.                                                                                                                |
| OrderDispatched  | Notification     | Notify buyer (order shipped).                                                                                                |
| OrderDispatched  | Analytics        | Record state.                                                                                                                |
| OrderDelivered   | Order Service    | Update order status to `delivered` (single writer: Order owns order; Logistics emits, Order consumes to keep state in sync). |
| OrderDelivered   | Payment Service  | Trigger auto-invoice creation for order if policy applies.                                                                   |
| OrderDelivered   | Trust Service    | Mark order as rateable; update on-time delivery metric for provider.                                                         |
| OrderDelivered   | Notification     | Notify buyer (delivered).                                                                                                    |
| OrderDelivered   | Analytics        | Record delivery.                                                                                                             |
| InvoiceGenerated | Notification     | Notify buyer (invoice issued).                                                                                               |
| InvoiceGenerated | Analytics        | Record invoice.                                                                                                              |
| PaymentInitiated | Analytics        | Optional.                                                                                                                    |
| PaymentCompleted | Notification     | Notify buyer and provider (payment received).                                                                                |
| PaymentCompleted | Analytics        | Record payment.                                                                                                              |
| PayoutExecuted   | Notification     | Notify provider (payout sent).                                                                                               |
| PayoutExecuted   | Analytics        | Record payout.                                                                                                               |
| RatingSubmitted  | Analytics        | Record rating.                                                                                                               |
| RatingSubmitted  | Search/Discovery | Trust Service updates provider stats; Discovery may refresh ranking (pull or event from Trust).                              |
| DisputeOpened    | Notification     | Notify provider and/or support.                                                                                              |
| DisputeOpened    | Analytics        | Record dispute.                                                                                                              |
| DisputeResolved  | Notification     | Notify parties.                                                                                                              |
| DisputeResolved  | Trust Service    | Update provider dispute rate for trust/ranking.                                                                              |
| DisputeResolved  | Payment Service  | If resolution includes refund, Admin calls Payment API; no event-driven refund to avoid duplicate.                           |
| DisputeResolved  | Analytics        | Record resolution.                                                                                                           |

Consumers must not perform writes to another service’s store. They call the owning service’s API when a mutation is required (e.g. Order Service exposes an internal “SetOrderDelivered(order_id)” used by its event handler when it consumes OrderDelivered).

---

## 4) Sync vs Async

### Synchronous flows

- **Order placement:** Client → Order Service. Order Service calls Identity (resolve principal), Business (validate location), Provider (product snapshot). Response returned to client. No event in the request path for “place order”; event OrderPlaced is emitted after commit.
- **Payment initiation:** Client → Payment Service. Payment Service creates payment record and returns redirect or client secret. PaymentCompleted is emitted when gateway webhook is received (async).
- **Resolve principal:** Any service → Identity. Validate token and get user_id + memberships. Sync call.
- **Create delivery:** Order Service or Logistics may create delivery via Logistics API (sync) when order is confirmed; alternatively Logistics consumes OrderConfirmed and creates delivery async. Choice: sync if delivery record is required before responding to confirm; async if “create delivery” can be eventual.

Synchronous flows are used when the caller needs the result to complete the use case (e.g. validate, get snapshot, create dependent record in same or owning service). No request–response over the event bus.

### Asynchronous flows

- **Notifications:** All notification delivery is async. Producer emits event; Notification Service consumes and sends email/push/SMS. No reply to producer.
- **Search index update:** ProviderVerified, ProductCreated, etc. → Search/Discovery consumes and updates index. Eventually consistent.
- **Trust / analytics:** OrderDelivered, RatingSubmitted, DisputeResolved → Trust and Analytics consume. No immediate consistency requirement.
- **Order status sync:** OrderDelivered emitted by Logistics; Order Service consumes and sets order status delivered. Async; acceptable delay (seconds to minutes).
- **Auto-invoice:** OrderDelivered → Payment Service consumes and may create invoice. Async.

Asynchronous flows are used when the action can be eventual and the producer does not need the result.

### Critical path events

Events that drive downstream writes or business-critical side effects. Failure to process must be visible and retried until success or compensated.

- **OrderDelivered:** Order status must eventually become delivered; Trust must update; Payment may create invoice. Critical consumers: Order Service, Trust, Payment (if auto-invoice).
- **PaymentCompleted:** Invoice and payout eligibility depend on it. Critical consumer: Payment Service (internal state), Notification.
- **OrderConfirmed:** Delivery creation and buyer notification. Critical consumers: Logistics (create delivery), Notification.

These events must be durable (persistent log), and consumers must be at-least-once with idempotent handling.

### Background events

Events used for analytics, indexing, or non-critical notifications. Processing can be delayed or batched; failure can be retried with backoff or sent to DLQ for later handling.

- **UserRegistered,** **BusinessCreated,** **ProviderVerified,** **ProductCreated** (for analytics/indexing).
- **OrderPlaced,** **OrderPrepared,** **OrderDispatched** (for analytics and optional notifications).
- **RatingSubmitted,** **DisputeOpened,** **DisputeResolved** (for analytics and Trust; Trust/Dispute resolution is important but can be retried).
- **PayoutExecuted,** **InvoiceGenerated** (notifications and analytics).

---

## 5) Failure Handling

### Retry logic

- **Producer:** Event is written to outbox or published to broker in the same transaction as the state change. If publish fails, transaction is rolled back or outbox is retried by a relay job. No “fire and forget” without durability.
- **Consumer:** Process event; on transient failure (5xx, timeout, DB deadlock), retry with exponential backoff. Max retries configurable (e.g. 5). Jitter to avoid thundering herd. After max retries, move to DLQ or dead-letter topic.
- **Idempotency:** Consumers must deduplicate by event_id (or event_id + consumer name). Processing the same event twice must not double-apply (e.g. two “order delivered” status updates, two invoices). Store processed event_ids with TTL or in a processed-events table; skip if already processed.

### Compensation actions

- **OrderDelivered consumed but Order Service fails to update:** Retry. If order is already delivered in DB, idempotent no-op. If order is still “shipped,” apply delivered. No automatic compensation that reverses a completed delivery.
- **PaymentCompleted consumed but Notification fails:** Retry notification only. No compensation on payment. Optional: “notification failed” table for manual or batch retry.
- **InvoiceGenerated consumed, Notification sends, but Payment Service later finds duplicate invoice:** Payment Service is the single writer for invoices; duplicate creation must be prevented by idempotency (e.g. invoice for order_id already exists → skip). No compensation that deletes a valid invoice.
- **DisputeResolved with refund:** Refund is initiated by Admin calling Payment API (sync). If refund fails, Admin is notified; no event-driven automatic refund retry without human or scheduled retry policy.

Compensation is limited to retrying the intended effect (idempotent) or manual intervention. No automatic “undo” of a committed state change in another service.

### Dead letter queue (DLQ)

- Events that exceed max consumer retries are moved to a DLQ (or dead-letter topic). DLQ is retained for inspection and manual or batch replay.
- Optional: alert on DLQ depth or per event_type. Replay after fixing bug or dependency; replay must be idempotent.
- No automatic replay from DLQ without operator or automated policy (e.g. “replay DLQ for event_type X after 1 hour”).

### Fallback flows

- **Notification unavailable:** Log “notification skipped” with event_id and recipient; do not block consumer. Optional: store in “pending notifications” for batch retry. Do not fail OrderDelivered or PaymentCompleted processing because notification failed.
- **Trust Service unavailable:** OrderDelivered consumer in Trust may retry. If Trust is down for extended period, events accumulate; Trust catches up when back. No fallback that skips trust update permanently; retry until success or DLQ.
- **Search/Discovery unavailable:** Index update events can be replayed from event log or DLQ when Search is back. No fallback that loses events; store and replay.

---

## 6) Event Principles

### Idempotency

- Every event has a unique `event_id`. Consumers must record `event_id` (and consumer name) before or after successful processing. On receipt of the same `event_id`, skip processing or return success (no duplicate side effects).
- Producers must not emit the same logical event twice with different event_ids (e.g. “order 123 delivered” once). If a producer retries, it must reuse the same event_id or the consumer must use a business key (e.g. order_id + “delivered”) to deduplicate.

### Ordering

- **Per-aggregate ordering:** Events that affect the same aggregate (e.g. same order_id) should be consumed in order when they are emitted in order. Use partition key = order_id (or entity_id) so one partition handles all events for that aggregate. Consumers that update “order status” must process OrderConfirmed before OrderDelivered when both are in the same partition.
- **No global ordering:** No guarantee across different order_ids or different event types. Only per-partition ordering where the broker supports it (e.g. Kafka partition ordering).
- **OrderDelivered and order status:** Order Service consumes OrderDelivered and sets status. If OrderDispatched and OrderDelivered are processed out of order (different partitions or different consumers), Order Service should apply only “latest” state (e.g. delivered overwrites shipped) or use a monotonic state machine and ignore older transitions.

### Versioning

- Every event payload has `schema_version` (e.g. 1). When the payload schema changes in a breaking way, introduce a new version (e.g. 2). Producers emit the version they use; consumers that support only v1 ignore v2 (or route to a v2 handler when implemented).
- Backward compatibility: add optional fields only in same version; do not remove fields. Breaking change = new version and new consumer handler.

### Schema evolution

- **Add optional field:** Same schema_version; consumers that do not need the field ignore it.
- **Remove field or change type:** New schema_version; old consumers may still process old version; new consumers handle new version. Deprecate old version and remove support after all producers and consumers are migrated.
- **Event schema registry:** Use a registry (e.g. schema registry) so consumers can validate and deserialise by schema_version. Reject or DLQ events that do not match any known schema.

### Traceability

- **event_id:** Unique per event; used for deduplication and logging.
- **correlation_id:** Optional; set by the first request in a flow (e.g. order placement) and propagated to all events and sync calls in that flow. Enables “trace all events and calls for this order.”
- **causation_id:** Optional; set to the event_id of the event that caused this action (e.g. downstream event or API call). Enables “this event was caused by that event.”
- **producer_service, occurred_at:** On every event for audit and debugging.

### Audit logging

- Producers log event emission: event_id, event_type, aggregate_id(s), occurred_at. Log to structured logs or audit store. Retention per policy.
- Consumers log consumption: event_id, consumer_service, processed_at, success/failure. Optional: store in AuditLog (Admin Service) or in service-owned audit table. Enables “who processed what and when.”
- Failed consumption and DLQ: log event_id, error, retry count. Replay and success are logged when events are replayed from DLQ.
