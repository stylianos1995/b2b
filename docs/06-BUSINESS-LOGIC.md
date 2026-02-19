# 6. Business Logic Rules

## 6.1 Pricing

- **Display:** Prices shown in provider’s currency (MVP: single platform currency). Tax included or excluded per provider setting; display clearly (e.g. “ex. VAT”).
- **Order:** Line unit_price is snapshot from Product at add-to-cart or submit. If product price changed after add-to-cart, recalculate on submit or show “Price updated” and require re-confirm.
- **Min order value:** If provider has min_order_value, reject submit when order subtotal < min. Show message: “Minimum order: £X.”
- **Delivery fee:** Optional. Set per provider or per order (fixed or by distance). Added as OrderLine (service) or order.delivery_fee. Calculated at submit.
- **Contract overrides (V2):** If business-provider contract has agreed prices, use those instead of catalog price for that business.

---

## 6.2 Availability

- **Discovery:** Provider appears in search only if (1) status = active, (2) at least one Availability record is active and overlaps requested geography (postcode in list or within radius_km), and (3) optional: has at least one active product.
- **Order submit:** Requested delivery date must fall on a day and time within provider’s Availability. If slot-based, requested_slot must be within a window. Reject with “No delivery available on this date.”
- **Overrides:** Provider can set one-off block dates (e.g. holiday). Exclude those dates when validating. MVP: optional; V1: implement.
- **Lead time:** If provider.lead_time_hours is set, order requested_delivery_date must be at least that many hours from submit time. Otherwise reject.

---

## 6.3 Cancellation

- **By buyer:** Allowed while order status is `submitted` or `confirmed`. After `preparing` or `shipped`, cancellation requires provider or admin (dispute). On cancel: set status = cancelled, cancelled_at = now, cancellation_reason optional. Notify provider.
- **By provider:** Allowed while status is `submitted` (reject with reason). After `confirmed`, treat as dispute or manual process. Notify buyer.
- **Refund:** If payment already taken (pay-on-order), cancellation triggers refund per refund rules. If invoice not yet paid, no charge; if paid, refund per 6.5.

---

## 6.4 Refunds

- **Full refund:** Order cancelled before delivery and payment was taken; or dispute resolved as full refund. Create refund (negative Payment or Refund record); process via Stripe Refund. Invoice status updated (e.g. credited or refunded).
- **Partial refund:** Dispute resolved as partial. Same mechanism; amount = agreed partial. Update invoice/payment state accordingly.
- **Window:** Refunds only within N days of delivery (e.g. 14). Configurable per platform or provider. Disputes after window can be closed or handled manually.

---

## 6.5 Disputes

- **Who can open:** Buyer only (for orders they received). One dispute per order.
- **When:** After order status = delivered. Optional: allow before delivery for “wrong order” type issues.
- **States:** Open → In review → Resolved (refund full / partial / none) or Closed (no action). Provider can respond; admin or automated flow resolves.
- **Resolution:** Refund creates Payment (refund) and updates Invoice/Order. No automatic chargeback; use platform refund to avoid chargeback when possible.
- **Escalation:** After X days unresolved, escalate to admin or flag for manual review.

---

## 6.6 Supplier Ranking (Discovery)

- **Factors (V1):** Average rating, number of ratings, on-time delivery rate, order count (or repeat rate). Weights configurable (e.g. rating 40%, on-time 30%, volume 30%).
- **On-time delivery:** % of orders where delivered_at <= estimated_delivery_at (or within grace period, e.g. 24h). Computed per provider; update on delivery or nightly job.
- **Sort options:** Relevance (score), rating, distance, min order value. Default: relevance.
- **Filtering:** Exclude providers with no availability for requested postcode/date. Exclude suspended. Optional: exclude below min rating threshold.

---

## 6.7 Trust Score

- **Inputs:** Average rating, number of completed orders, dispute rate (disputes per 100 orders), on-time delivery rate, response time (time to confirm order). Weights configurable.
- **Display:** 0–100 or 1–5 stars. Shown on provider card and profile. Update: nightly aggregate job or on new rating/dispute/delivery.
- **Use:** Sort and filter in discovery. Optional: badge “Top rated” above threshold.

---

## 6.8 Reliability Metrics

- **For provider:**
  - **On-time delivery rate:** % delivered on or before estimated (or within grace).
  - **Order acceptance rate:** % of submitted orders confirmed (vs rejected).
  - **Response time:** Median time from order submitted to confirmed.
- **Storage:** Either computed on read (expensive) or materialized in ProviderStats table updated by job on order/delivery events.
- **Use:** Display on provider profile; feed into trust score and ranking.

---

## 6.9 Invoicing Rules

- **When to create:** (1) Manual: provider creates from order(s). (2) Auto: when order status = delivered, job creates one invoice per order (MVP/V1). (3) Batch: weekly job creates one invoice per business-provider for all delivered orders in period (V1/V2).
- **Due date:** issued_at + payment_terms_days (provider or contract default, e.g. 14).
- **Overdue:** status = overdue when current_date > due_date and status still issued. Reminder notifications; optional late fee (V2).

---

## 6.10 Payout Rules

- **Eligibility:** Invoices with status = paid; not yet included in a payout. Optionally exclude disputed orders until resolved.
- **Schedule:** Weekly or biweekly; configurable. Run job; for each provider sum (invoice total − platform fee); trigger transfer.
- **Hold:** Optional hold period (e.g. 7 days after payment) before including in payout to cover refunds/disputes.
- **Minimum:** Optional min payout amount; below that roll to next run.
