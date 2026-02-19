# Testing payments (Stripe Checkout)

Payments in the B2B app use **Stripe Checkout**. To test the full flow you need Stripe **test** keys and (optionally) webhook forwarding so the app marks the invoice as paid after checkout.

## Prerequisites

1. **Stripe test keys**  
   - [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys)  
   - Use **Test mode** (toggle in the dashboard).  
   - In `.env` or `.env.local`:
     - `STRIPE_SECRET_KEY=sk_test_...`
     - `STRIPE_PUBLIC_KEY=pk_test_...` (only needed if you use Stripe.js in the frontend; Checkout uses the backend only)
     - `STRIPE_WEBHOOK_SECRET=whsec_...` (see Webhook below)

2. **Frontend URL**  
   After payment, Stripe redirects the buyer back to your app. Set:
   - `FRONTEND_URL=http://localhost:5173` (or the URL where your frontend runs)

3. **API and frontend running**  
   - Backend: `npm run start:dev` (e.g. http://localhost:3000)  
   - Frontend: from `frontend/` run your dev server (e.g. `npm run dev` → http://localhost:5173)  
   - If the frontend calls the API on another port, configure your dev server to proxy `/v1` to the API.

## Stripe test cards

In Checkout use these **test card numbers** (any future expiry, any CVC):

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

Use any future expiry (e.g. 12/34) and any 3-digit CVC.  
More: [Stripe Testing](https://docs.stripe.com/testing).

## How to trigger a payment in the app

You need an **unpaid invoice** for a business you can log in as (buyer).

### Option A: Full flow in the UI (recommended)

1. **Buyer** (e.g. `buyer@mvp.local` / `password`):
   - Ensure **My Business** and a delivery address exist.
   - **Discover** → choose a provider → add products to cart → **Place order**.

2. **Provider** (e.g. `provider@mvp.local` / `password`):
   - **Orders** → open the new order → **Confirm order**.
   - Then: **Mark preparing** → **Mark dispatched** → **Mark delivered**.

3. **Provider** again:
   - **Invoices** → **Create invoice** from that delivered order (if your UI exposes it), or use the API:  
   - `POST /v1/invoices` with `{ "order_id": "<order-id>" }` (as provider).

4. **Buyer** again:
   - **My Invoices** → find the unpaid invoice → **Pay invoice**.
   - You are redirected to Stripe Checkout. Use test card `4242 4242 4242 4242`.
   - After payment, Stripe redirects to `FRONTEND_URL/buyer/invoices?success=true`.

### Option B: One unpaid invoice from seed (quick test)

The seed data creates a **paid** invoice. To get one unpaid invoice for the seed buyer:

1. Run migrations and seed: `npm run migrate`, then run seed (e.g. via `test-api.html` **Run seed** or `npm run seed`).
2. In the database, set the seed invoice to unpaid and remove the payment (so the buyer can pay it again):

```sql
-- Use your seed invoice id (e.g. from seed-mvp.sql)
UPDATE invoices
SET status = 'issued', paid_at = NULL, stripe_session_id = NULL
WHERE id = '90000001-0000-4000-8000-000000000001';

DELETE FROM payments
WHERE invoice_id = '90000001-0000-4000-8000-000000000001';
```

3. Log in as **buyer** (`buyer@mvp.local`), go to **My Invoices**, and click **Pay invoice** for that invoice.

## Webhook (so the app marks the invoice as paid)

When the customer completes Checkout, Stripe sends a `checkout.session.completed` event to your **webhook** endpoint. The app uses that to mark the invoice as paid and create the payment record.

- **Local testing:** use the Stripe CLI to forward events to your machine:
  1. [Install Stripe CLI](https://docs.stripe.com/stripe-cli).
  2. Run:  
     `stripe listen --forward-to localhost:3000/v1/payments/webhook`
  3. Copy the **webhook signing secret** (e.g. `whsec_...`) and set `STRIPE_WEBHOOK_SECRET` in `.env` (or `.env.local`).
  4. Restart the API so it picks up the new secret.

- **Without webhook:** Checkout and the redirect still work, but the app will not mark the invoice as paid until it receives the webhook. You can still verify that the redirect and Stripe Dashboard show the payment.

## E2E test (automated)

The repo includes an E2E test that runs the full flow (order → confirm → deliver → invoice → create checkout session → simulate webhook). It uses test Stripe keys and a simulated webhook so no real Stripe Checkout is opened. Run it with:

```bash
# Set Stripe keys (use test keys; webhook secret can be any value for this test)
$env:STRIPE_SECRET_KEY="sk_test_..."; $env:STRIPE_WEBHOOK_SECRET="whsec_e2e_test_secret"; npm run test:e2e
```

This does not open a browser; it asserts the API and DB state after the simulated payment.
