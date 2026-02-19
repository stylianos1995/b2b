/**
 * Full E2E test: buyer and provider lifecycle through Stripe payment.
 *
 * Flow: register both → business + provider + product → place order (idempotency) →
 * confirm → mark delivered → create invoice → checkout session → simulate webhook →
 * assert invoice paid and single payment; send webhook again → assert no duplicate payment.
 *
 * Uses real DB (DATABASE_URL or TEST_DATABASE_URL). Requires STRIPE_SECRET_KEY and
 * STRIPE_WEBHOOK_SECRET for checkout and webhook signature verification.
 *
 * Load .env so npm run test:e2e picks up DATABASE_URL, STRIPE_* from your .env or .env.local.
 */
import { config } from "dotenv";
import { resolve } from "path";

// Load from project root (Jest cwd is project root; ensure .env is found)
const root = resolve(process.cwd());
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { DataSource } from "typeorm";
import * as request from "supertest";
import type { Request, Response, NextFunction } from "express";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require("express") as typeof import("express");
import Stripe from "stripe";
import { AppModule } from "../../src/app.module";

const PREFIX = "/v1";

describe("Full payment flow (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let buyerToken: string;
  let providerToken: string;
  let businessId: string;
  let deliveryLocationId: string;
  let providerId: string;
  let productId: string;
  let orderId: string;
  let deliveryId: string;
  let invoiceId: string;
  let stripeSessionId: string;
  const idempotencyKey = "e2e-order-" + Date.now();

  beforeAll(async () => {
    const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("Set DATABASE_URL or TEST_DATABASE_URL for e2e tests");
    }
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error(
        "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET for e2e tests (e.g. in .env or .env.local).",
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });

    // Same body parser as main.ts: raw for webhook, JSON for rest (required for signature verification).
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl === "/v1/payments/webhook" && req.method === "POST") {
        express.raw({ type: "application/json" })(req, res, next);
      } else {
        express.json()(req, res, next);
      }
    });

    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // Clean tables in FK-safe order so test runs against a fresh state.
    await truncateAll(dataSource);
  }, 90_000);

  afterAll(async () => {
    await app?.close();
  });

  async function truncateAll(ds: DataSource) {
    const qr = ds.createQueryRunner();
    await qr.connect();
    try {
      await qr.query(
        "TRUNCATE TABLE payments, invoice_lines, invoices, order_lines, deliveries, ratings, orders, products, business_users, provider_users, locations, businesses, providers, sessions, users RESTART IDENTITY CASCADE",
      );
    } finally {
      await qr.release();
    }
  }

  /** Register and return nothing; then login to get token. */
  async function register(
    email: string,
    password: string,
    first_name: string,
    last_name: string,
  ) {
    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/register`)
      .send({ email, password, first_name, last_name })
      .expect(201);
  }

  /** Login and return access_token. */
  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/login`)
      .send({ email, password })
      .expect(200);
    const body = res.body as { access_token?: string };
    if (!body.access_token)
      throw new Error("No access_token in login response");
    return body.access_token;
  }

  it("runs full lifecycle: register → business → provider → product → order → confirm → deliver → invoice → checkout → webhook → assert idempotency", async () => {
    const buyerEmail = `buyer-e2e-${Date.now()}@test.local`;
    const providerEmail = `provider-e2e-${Date.now()}@test.local`;
    const password = "password12345";

    // --- 1) Buyer registers ---
    await register(buyerEmail, password, "Buyer", "E2E");

    // --- 2) Buyer logs in and creates business ---
    buyerToken = await login(buyerEmail, password);
    const createBiz = await request(app.getHttpServer())
      .post(`${PREFIX}/businesses`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        legal_name: "E2E Business Ltd",
        trading_name: "E2E Business",
        business_type: "restaurant",
        address_line_1: "1 Test St",
        city: "London",
        region: "Greater London",
        postal_code: "SW1A 1AA",
        country: "GB",
      })
      .expect(201);
    businessId = (createBiz.body as { business_id: string }).business_id;

    const getBiz = await request(app.getHttpServer())
      .get(`${PREFIX}/businesses/${businessId}`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(200);
    deliveryLocationId = (
      getBiz.body as { default_delivery_address_id: string }
    ).default_delivery_address_id;
    if (!deliveryLocationId)
      throw new Error("Business has no default_delivery_address_id");

    // --- 3) Provider registers ---
    await register(providerEmail, password, "Provider", "E2E");

    // --- 4) Provider logs in, creates profile and product ---
    providerToken = await login(providerEmail, password);
    const createProvider = await request(app.getHttpServer())
      .post(`${PREFIX}/providers`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({
        legal_name: "E2E Provider Ltd",
        trading_name: "E2E Provider",
        provider_type: "food_wholesaler",
        address_line_1: "2 Supplier Rd",
        city: "Manchester",
        region: "Greater Manchester",
        postal_code: "M1 1AA",
        country: "GB",
      })
      .expect(201);
    providerId = (createProvider.body as { provider_id: string }).provider_id;

    // Place order requires provider status 'active'; new providers are 'pending_verification'. Set active for E2E.
    await dataSource.query("UPDATE providers SET status = $1 WHERE id = $2", [
      "active",
      providerId,
    ]);

    const createProduct = await request(app.getHttpServer())
      .post(`${PREFIX}/providers/${providerId}/products`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({
        sku: "E2E-SKU-001",
        name: "E2E Test Product",
        category: "dry_goods",
        unit: "kg",
        price: 10,
        currency: "GBP",
        tax_rate: 0,
      })
      .expect(201);
    productId = (createProduct.body as { product_id: string }).product_id;

    // --- 5) Buyer places order (with idempotency header) ---
    const requestedDate = new Date();
    requestedDate.setDate(requestedDate.getDate() + 7);
    const placeOrder = await request(app.getHttpServer())
      .post(`${PREFIX}/buyer/orders`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .set("Idempotency-Key", idempotencyKey)
      .send({
        provider_id: providerId,
        delivery_location_id: deliveryLocationId,
        requested_delivery_date: requestedDate.toISOString().slice(0, 10),
        lines: [{ product_id: productId, quantity: 2 }],
      })
      .expect(201);
    orderId = (placeOrder.body as { order_id: string }).order_id;

    // --- 6) Provider confirms order ---
    await request(app.getHttpServer())
      .post(`${PREFIX}/provider/orders/${orderId}/confirm`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({})
      .expect(201);

    // --- 7) Provider marks delivery as delivered ---
    const getOrder = await request(app.getHttpServer())
      .get(`${PREFIX}/provider/orders/${orderId}`)
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);
    deliveryId = (getOrder.body as { delivery_id: string }).delivery_id;
    if (!deliveryId) throw new Error("Order has no delivery_id after confirm");

    await request(app.getHttpServer())
      .patch(`${PREFIX}/deliveries/${deliveryId}`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "delivered" })
      .expect(200);

    // --- 8) Provider creates invoice ---
    const createInv = await request(app.getHttpServer())
      .post(`${PREFIX}/invoices`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ order_id: orderId })
      .expect(201);
    invoiceId = (createInv.body as { invoice_id: string }).invoice_id;

    // --- 9) Buyer initiates Stripe checkout session ---
    const checkout = await request(app.getHttpServer())
      .post(`${PREFIX}/payments/checkout-session`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ invoiceId })
      .expect(200);
    const url = (checkout.body as { url: string }).url;
    expect(url).toContain("stripe.com");

    // Extract stripe_session_id from DB (stored by StripeService when creating session).
    const rows = (await dataSource.query(
      "SELECT stripe_session_id FROM invoices WHERE id = $1",
      [invoiceId],
    )) as Array<{ stripe_session_id: string }>;
    stripeSessionId = rows[0]?.stripe_session_id ?? "";
    expect(stripeSessionId).toBeDefined();
    expect(stripeSessionId).toMatch(/^cs_/);

    // --- 10) Simulate Stripe webhook: checkout.session.completed ---
    const invoiceRow = await dataSource.query(
      "SELECT total, currency FROM invoices WHERE id = $1",
      [invoiceId],
    );
    const total = Number(invoiceRow[0].total);
    const currency = (invoiceRow[0].currency as string).toLowerCase();
    const amountTotal =
      currency === "jpy" || currency === "krw"
        ? Math.round(total)
        : Math.round(total * 100);

    const stripeEvent: Stripe.Event = {
      id: "evt_e2e_test_" + Date.now(),
      object: "event",
      api_version: "2024-11-20.acacia",
      created: Math.floor(Date.now() / 1000),
      type: "checkout.session.completed",
      data: {
        object: {
          id: stripeSessionId,
          object: "checkout.session",
          payment_intent: "pi_test_123",
          amount_total: amountTotal,
          currency,
          metadata: { invoice_id: invoiceId },
        } as unknown as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: { id: null, idempotency_key: null },
    };

    const payload = JSON.stringify(stripeEvent);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    });

    const webhookRes = await request(app.getHttpServer())
      .post(`${PREFIX}/payments/webhook`)
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload)
      .expect(200);

    expect((webhookRes.body as { received: boolean }).received).toBe(true);

    // --- 11) Assertions: invoice paid, payment exists, linked to invoice ---
    const invoiceAfter = await dataSource.query(
      "SELECT status, paid_at FROM invoices WHERE id = $1",
      [invoiceId],
    );
    expect(invoiceAfter[0].status).toBe("paid");
    expect(invoiceAfter[0].paid_at).not.toBeNull();

    const payments = await dataSource.query(
      "SELECT id, invoice_id, stripe_payment_intent_id, amount, currency, status FROM payments WHERE invoice_id = $1",
      [invoiceId],
    );
    expect(payments).toHaveLength(1);
    expect(payments[0].stripe_payment_intent_id).toBe("pi_test_123");
    expect(payments[0].invoice_id).toBe(invoiceId);
    expect(payments[0].status).toBe("completed");

    // --- 12) Idempotency: send same webhook again, must not create duplicate payment ---
    const webhookRes2 = await request(app.getHttpServer())
      .post(`${PREFIX}/payments/webhook`)
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload)
      .expect(200);

    expect((webhookRes2.body as { received: boolean }).received).toBe(true);

    const paymentsAfterSecond = await dataSource.query(
      "SELECT id FROM payments WHERE invoice_id = $1",
      [invoiceId],
    );
    expect(paymentsAfterSecond).toHaveLength(1);
  });

  it("rejects webhook with invalid signature", async () => {
    const payload = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { id: "cs_fake" } },
    });
    await request(app.getHttpServer())
      .post(`${PREFIX}/payments/webhook`)
      .set("stripe-signature", "v1=invalid_signature")
      .set("Content-Type", "application/json")
      .send(payload)
      .expect(400);
  });
});
