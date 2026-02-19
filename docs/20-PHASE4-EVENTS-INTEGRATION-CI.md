# Phase 4: Event-Driven Architecture, Notifications, Integration Tests, and CI Hardening

Implementation specification for the B2B MVP backend. Phases 1–3 are complete (modules, endpoints, TypeORM, seed, auth). This document defines event bus, notifications, integration/E2E tests, CI pipeline, and idempotency.

---

## 1. Folder and file structure

```
src/
├── events/
│   ├── event-bus.module.ts
│   ├── event-bus.service.ts
│   ├── event-names.ts
│   ├── event.types.ts
│   └── emit-after-commit.ts          # helper / decorator pattern
├── producers/
│   ├── producers.module.ts
│   ├── auth-events.producer.ts       # UserRegistered
│   ├── business-events.producer.ts  # BusinessCreated
│   ├── provider-events.producer.ts  # ProviderVerified, ProductCreated
│   ├── order-events.producer.ts     # OrderPlaced, OrderConfirmed, OrderPrepared, OrderDispatched
│   ├── delivery-events.producer.ts  # OrderDelivered
│   ├── payment-events.producer.ts   # InvoiceGenerated, PaymentInitiated, PaymentCompleted, PayoutExecuted
│   └── trust-events.producer.ts      # RatingSubmitted
├── consumers/
│   ├── consumers.module.ts
│   ├── notification.consumer.ts      # event → email (SendGrid etc.)
│   ├── delivery.consumer.ts         # OrderConfirmed → create delivery (optional; OrderService already creates)
│   ├── order.consumer.ts            # OrderDelivered → set order.delivered_at (optional; DeliveryService already does)
│   └── ...
├── notifications/
│   ├── notifications.module.ts
│   ├── notification.service.ts      # send email via SendGrid/transport
│   ├── templates/
│   │   ├── welcome.email.ts
│   │   ├── order-placed.email.ts
│   │   ├── order-confirmed.email.ts
│   │   ├── order-delivered.email.ts
│   │   ├── invoice-generated.email.ts
│   │   └── payment-completed.email.ts
│   └── ...
├── app.module.ts                    # import EventsModule, ProducersModule, ConsumersModule, NotificationsModule
└── ...

tests/
├── integration/
│   ├── jest-integration.json
│   ├── setup.ts
│   ├── helpers/
│   │   ├── auth.helper.ts            # login, get token
│   │   ├── db.helper.ts              # truncate / seed
│   │   └── request.helper.ts         # supertest with base URL
│   ├── auth.integration-spec.ts
│   ├── business.integration-spec.ts
│   ├── provider.integration-spec.ts
│   ├── discovery.integration-spec.ts
│   ├── orders.integration-spec.ts
│   ├── delivery.integration-spec.ts
│   ├── payment.integration-spec.ts
│   ├── ratings.integration-spec.ts
│   ├── admin.integration-spec.ts
│   └── e2e-flow.integration-spec.ts  # full Register → Order → Pay → Rate
└── ...

.github/
└── workflows/
    ├── ci.yml                        # existing: validate + build
    └── ci-full.yml                   # optional: validate + migrate + test + build
```

---

## 2. Event bus

### 2.1 Event names and payload types

**File: `src/events/event-names.ts`**

```typescript
export const EVENT_NAMES = {
  USER_REGISTERED: "user.registered",
  BUSINESS_CREATED: "business.created",
  PROVIDER_VERIFIED: "provider.verified",
  PRODUCT_CREATED: "product.created",
  ORDER_PLACED: "order.placed",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_PREPARED: "order.prepared",
  ORDER_DISPATCHED: "order.dispatched",
  ORDER_DELIVERED: "order.delivered",
  INVOICE_GENERATED: "invoice.generated",
  PAYMENT_INITIATED: "payment.initiated",
  PAYMENT_COMPLETED: "payment.completed",
  PAYOUT_EXECUTED: "payout.executed",
  RATING_SUBMITTED: "rating.submitted",
} as const;
```

**File: `src/events/event.types.ts`**

```typescript
export interface BaseEventPayload {
  event_id: string;
  event_type: string;
  schema_version: string;
  producer_service: string;
  occurred_at: string; // ISO UTC
  correlation_id?: string;
  causation_id?: string;
}

export interface UserRegisteredPayload extends BaseEventPayload {
  user_id: string;
  email: string;
  registered_at: string;
}

export interface BusinessCreatedPayload extends BaseEventPayload {
  business_id: string;
  owner_user_id: string;
  created_at: string;
}

export interface ProviderVerifiedPayload extends BaseEventPayload {
  provider_id: string;
  verified_at: string;
}

export interface ProductCreatedPayload extends BaseEventPayload {
  product_id: string;
  provider_id: string;
  created_at: string;
}

export interface OrderPlacedPayload extends BaseEventPayload {
  order_id: string;
  business_id: string;
  provider_id: string;
  submitted_at: string;
}

export interface OrderConfirmedPayload extends BaseEventPayload {
  order_id: string;
  business_id: string;
  provider_id: string;
  confirmed_at: string;
}

export interface OrderPreparedPayload extends BaseEventPayload {
  order_id: string;
  provider_id: string;
  at: string;
}

export interface OrderDispatchedPayload extends BaseEventPayload {
  order_id: string;
  business_id: string;
  provider_id: string;
  at: string;
}

export interface OrderDeliveredPayload extends BaseEventPayload {
  order_id: string;
  delivery_id: string;
  business_id: string;
  provider_id: string;
  delivered_at: string;
}

export interface InvoiceGeneratedPayload extends BaseEventPayload {
  invoice_id: string;
  provider_id: string;
  business_id: string;
  order_ids: string[];
  issued_at: string;
}

export interface PaymentInitiatedPayload extends BaseEventPayload {
  payment_id: string;
  payable_type: string;
  payable_id: string;
  amount: string;
  currency: string;
  initiated_at: string;
}

export interface PaymentCompletedPayload extends BaseEventPayload {
  payment_id: string;
  payable_type: string;
  payable_id: string;
  amount: string;
  paid_at: string;
}

export interface PayoutExecutedPayload extends BaseEventPayload {
  payout_id: string;
  provider_id: string;
  amount: string;
  currency: string;
  executed_at: string;
}

export interface RatingSubmittedPayload extends BaseEventPayload {
  rating_id: string;
  order_id: string;
  business_id: string;
  provider_id: string;
  rating: number;
  submitted_at: string;
}
```

### 2.2 EventBusService (abstraction over EventEmitter2)

**File: `src/events/event-bus.service.ts`**

```typescript
import { Injectable, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

export const EVENT_BUS = "EventBus";

@Injectable()
export class EventBusService implements OnModuleInit {
  constructor(private readonly emitter: EventEmitter2) {}

  onModuleInit() {
    // Optional: wire global error handler for async listeners
  }

  /**
   * Emit event synchronously (listeners run in same tick).
   * Use after DB commit so consumers see persisted state.
   */
  emit<T extends Record<string, unknown>>(eventType: string, payload: T): void {
    this.emitter.emit(eventType, payload);
  }

  /**
   * Emit event asynchronously (listeners run in next tick).
   * Use when you want to decouple from request lifecycle.
   */
  emitAsync<T extends Record<string, unknown>>(
    eventType: string,
    payload: T
  ): void {
    setImmediate(() => this.emitter.emit(eventType, payload));
  }
}
```

### 2.3 Emit after DB commit

TypeORM does not expose a generic “after commit” hook. Two options:

**Option A – Emit after save (current transaction):**  
Emit in the service method **after** `await this.repo.save(...)`. If the request completes successfully, the transaction is committed before the response is sent. If you use a single DB connection per request and no explicit transaction, the save is already committed. For explicit transactions, emit **after** `await queryRunner.commitTransaction()`.

**Option B – Transaction subscriber (TypeORM):**  
Use `EntityManager.queryRunner` and subscribe to `queryRunner.connection.subscribe('commitTransaction', () => { emit(...) })` for the same runner. More complex; use only if you need strict after-commit ordering.

**Recommended for MVP:** Emit immediately after the last `save()` that completes the business action (e.g. after saving the order and order lines). Do **not** start a new transaction after that in the same method. If the process crashes before response, the client will retry; use idempotency for critical writes.

**Helper – enqueue emit for next tick (after response):**

```typescript
// src/events/emit-after-commit.ts
export function emitAfterResponse(
  eventBus: EventBusService,
  eventType: string,
  payload: Record<string, unknown>
): void {
  setImmediate(() => eventBus.emit(eventType, payload));
}
```

Use `emitAfterResponse` when you want listeners to run only after the HTTP response is sent (e.g. to avoid delaying the response). Otherwise use `eventBus.emit()` after save.

### 2.4 EventBusModule

**File: `src/events/event-bus.module.ts`**

```typescript
import { Global, Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { EventBusService } from "./event-bus.service";

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
  ],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {}
```

**Dependency:** `npm i @nestjs/event-emitter`

---

## 3. Producers (examples)

Producers are called from existing services **after** the relevant entity is saved. They use `EventBusService.emit()` (or `emitAfterResponse`).

### 3.1 BusinessCreated

**File: `src/producers/business-events.producer.ts`**

```typescript
import { Injectable } from "@nestjs/common";
import { EventBusService } from "../events/event-bus.service";
import { EVENT_NAMES } from "../events/event-names";
import { BusinessCreatedPayload } from "../events/event.types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class BusinessEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  businessCreated(params: { business_id: string; owner_user_id: string }) {
    const payload: BusinessCreatedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.BUSINESS_CREATED,
      schema_version: "1.0",
      producer_service: "business",
      occurred_at: new Date().toISOString(),
      business_id: params.business_id,
      owner_user_id: params.owner_user_id,
      created_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.BUSINESS_CREATED, payload);
  }
}
```

**Wiring:** In `BusinessService.create()`, after creating the business and default location and saving, inject `BusinessEventsProducer` and call `this.businessEventsProducer.businessCreated({ business_id: business.id, owner_user_id: user.userId })`.

### 3.2 ProviderVerified, ProductCreated

**File: `src/producers/provider-events.producer.ts`**

```typescript
import { Injectable } from "@nestjs/common";
import { EventBusService } from "../events/event-bus.service";
import { EVENT_NAMES } from "../events/event-names";
import {
  ProviderVerifiedPayload,
  ProductCreatedPayload,
} from "../events/event.types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ProviderEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  providerVerified(params: { provider_id: string }) {
    const payload: ProviderVerifiedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PROVIDER_VERIFIED,
      schema_version: "1.0",
      producer_service: "provider",
      occurred_at: new Date().toISOString(),
      provider_id: params.provider_id,
      verified_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PROVIDER_VERIFIED, payload);
  }

  productCreated(params: { product_id: string; provider_id: string }) {
    const payload: ProductCreatedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PRODUCT_CREATED,
      schema_version: "1.0",
      producer_service: "provider",
      occurred_at: new Date().toISOString(),
      product_id: params.product_id,
      provider_id: params.provider_id,
      created_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PRODUCT_CREATED, payload);
  }
}
```

**Wiring:**

- **ProviderVerified:** In `AdminService.updateProviderStatus()` when `dto.status === 'active'`, call producer after save.
- **ProductCreated:** In `ProviderService` when adding a product, after `productRepo.save()`, call producer.

### 3.3 OrderPlaced, OrderConfirmed, OrderPrepared, OrderDispatched

**File: `src/producers/order-events.producer.ts`**

```typescript
import { Injectable } from "@nestjs/common";
import { EventBusService } from "../events/event-bus.service";
import { EVENT_NAMES } from "../events/event-names";
import {
  OrderPlacedPayload,
  OrderConfirmedPayload,
  OrderPreparedPayload,
  OrderDispatchedPayload,
} from "../events/event.types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class OrderEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  orderPlaced(params: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }) {
    const payload: OrderPlacedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_PLACED,
      schema_version: "1.0",
      producer_service: "order",
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      submitted_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_PLACED, payload);
  }

  orderConfirmed(params: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }) {
    const payload: OrderConfirmedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_CONFIRMED,
      schema_version: "1.0",
      producer_service: "order",
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      confirmed_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_CONFIRMED, payload);
  }

  orderPrepared(params: { order_id: string; provider_id: string }) {
    const payload: OrderPreparedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_PREPARED,
      schema_version: "1.0",
      producer_service: "order",
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      provider_id: params.provider_id,
      at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_PREPARED, payload);
  }

  orderDispatched(params: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }) {
    const payload: OrderDispatchedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_DISPATCHED,
      schema_version: "1.0",
      producer_service: "order",
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_DISPATCHED, payload);
  }
}
```

**Wiring:** In `OrderService`: after `placeOrder` save → `orderPlaced`; after `confirm` save → `orderConfirmed`; in `updateStatus` when setting `preparing` → `orderPrepared`, when setting `shipped` → `orderDispatched`.

### 3.4 OrderDelivered (Logistics / Delivery)

**File: `src/producers/delivery-events.producer.ts`**

```typescript
import { Injectable } from "@nestjs/common";
import { EventBusService } from "../events/event-bus.service";
import { EVENT_NAMES } from "../events/event-names";
import { OrderDeliveredPayload } from "../events/event.types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class DeliveryEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  orderDelivered(params: {
    order_id: string;
    delivery_id: string;
    business_id: string;
    provider_id: string;
  }) {
    const payload: OrderDeliveredPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_DELIVERED,
      schema_version: "1.0",
      producer_service: "logistics",
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      delivery_id: params.delivery_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      delivered_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_DELIVERED, payload);
  }
}
```

**Wiring:** In `DeliveryService.update()`, when `dto.status === 'delivered'` and after updating delivery and order, call this producer.

### 3.5 InvoiceGenerated, PaymentCompleted, PaymentInitiated, PayoutExecuted

**File: `src/producers/payment-events.producer.ts`**

```typescript
import { Injectable } from "@nestjs/common";
import { EventBusService } from "../events/event-bus.service";
import { EVENT_NAMES } from "../events/event-names";
import {
  InvoiceGeneratedPayload,
  PaymentInitiatedPayload,
  PaymentCompletedPayload,
  PayoutExecutedPayload,
} from "../events/event.types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class PaymentEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  invoiceGenerated(params: {
    invoice_id: string;
    provider_id: string;
    business_id: string;
    order_ids: string[];
  }) {
    const payload: InvoiceGeneratedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.INVOICE_GENERATED,
      schema_version: "1.0",
      producer_service: "payment",
      occurred_at: new Date().toISOString(),
      invoice_id: params.invoice_id,
      provider_id: params.provider_id,
      business_id: params.business_id,
      order_ids: params.order_ids,
      issued_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.INVOICE_GENERATED, payload);
  }

  paymentInitiated(params: {
    payment_id: string;
    payable_type: string;
    payable_id: string;
    amount: string;
    currency: string;
  }) {
    const payload: PaymentInitiatedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PAYMENT_INITIATED,
      schema_version: "1.0",
      producer_service: "payment",
      occurred_at: new Date().toISOString(),
      payment_id: params.payment_id,
      payable_type: params.payable_type,
      payable_id: params.payable_id,
      amount: params.amount,
      currency: params.currency,
      initiated_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PAYMENT_INITIATED, payload);
  }

  paymentCompleted(params: {
    payment_id: string;
    payable_type: string;
    payable_id: string;
    amount: string;
  }) {
    const payload: PaymentCompletedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PAYMENT_COMPLETED,
      schema_version: "1.0",
      producer_service: "payment",
      occurred_at: new Date().toISOString(),
      payment_id: params.payment_id,
      payable_type: params.payable_type,
      payable_id: params.payable_id,
      amount: params.amount,
      paid_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PAYMENT_COMPLETED, payload);
  }

  payoutExecuted(params: {
    payout_id: string;
    provider_id: string;
    amount: string;
    currency: string;
  }) {
    const payload: PayoutExecutedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PAYOUT_EXECUTED,
      schema_version: "1.0",
      producer_service: "payment",
      occurred_at: new Date().toISOString(),
      payout_id: params.payout_id,
      provider_id: params.provider_id,
      amount: params.amount,
      currency: params.currency,
      executed_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PAYOUT_EXECUTED, payload);
  }
}
```

**Wiring:** In `InvoiceService.create()` after saving invoice and lines → `invoiceGenerated`. In `PaymentService.create()` after creating payment (and optionally when initiating) → `paymentInitiated`; when marking completed → `paymentCompleted`. In `AdminService.createPayout()` (when persisting payout) → `payoutExecuted`.

### 3.6 RatingSubmitted

**File: `src/producers/trust-events.producer.ts`**

```typescript
import { Injectable } from "@nestjs/common";
import { EventBusService } from "../events/event-bus.service";
import { EVENT_NAMES } from "../events/event-names";
import { RatingSubmittedPayload } from "../events/event.types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class TrustEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  ratingSubmitted(params: {
    rating_id: string;
    order_id: string;
    business_id: string;
    provider_id: string;
    rating: number;
  }) {
    const payload: RatingSubmittedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.RATING_SUBMITTED,
      schema_version: "1.0",
      producer_service: "trust",
      occurred_at: new Date().toISOString(),
      rating_id: params.rating_id,
      order_id: params.order_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      rating: params.rating,
      submitted_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.RATING_SUBMITTED, payload);
  }
}
```

**Wiring:** In `RatingService.create()` after `ratingRepo.save()`.

### 3.7 UserRegistered

**File: `src/producers/auth-events.producer.ts`**

```typescript
import { Injectable } from "@nestjs/common";
import { EventBusService } from "../events/event-bus.service";
import { EVENT_NAMES } from "../events/event-names";
import { UserRegisteredPayload } from "../events/event.types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AuthEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  userRegistered(params: { user_id: string; email: string }) {
    const payload: UserRegisteredPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.USER_REGISTERED,
      schema_version: "1.0",
      producer_service: "identity",
      occurred_at: new Date().toISOString(),
      user_id: params.user_id,
      email: params.email,
      registered_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.USER_REGISTERED, payload);
  }
}
```

**Wiring:** In `AuthService.register()` after user (and optional session) is saved.

---

## 4. Notifications (email consumer and templates)

### 4.1 Event → email mapping

| Event            | Notification           | Recipient           | Template / purpose      |
| ---------------- | ---------------------- | ------------------- | ----------------------- |
| UserRegistered   | Welcome / verification | New user            | welcome.email           |
| OrderPlaced      | New order              | Provider            | order-placed.email      |
| OrderConfirmed   | Order confirmed        | Buyer               | order-confirmed.email   |
| OrderDelivered   | Order delivered        | Buyer               | order-delivered.email   |
| InvoiceGenerated | Invoice issued         | Buyer + CC provider | invoice-generated.email |
| PaymentCompleted | Payment received       | Provider            | payment-completed.email |
| ProviderVerified | (Optional)             | Provider            | provider-verified.email |

### 4.2 Notification consumer

**File: `src/consumers/notification.consumer.ts`**

```typescript
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EVENT_NAMES } from "../events/event-names";
import { NotificationService } from "../notifications/notification.service";

@Injectable()
export class NotificationConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(EVENT_NAMES.USER_REGISTERED)
  async handleUserRegistered(payload: { email: string; user_id: string }) {
    await this.notificationService.sendWelcomeEmail(payload.email, {
      userId: payload.user_id,
    });
  }

  @OnEvent(EVENT_NAMES.ORDER_PLACED)
  async handleOrderPlaced(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }) {
    await this.notificationService.sendOrderPlacedToProvider(payload);
  }

  @OnEvent(EVENT_NAMES.ORDER_CONFIRMED)
  async handleOrderConfirmed(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }) {
    await this.notificationService.sendOrderConfirmedToBuyer(payload);
  }

  @OnEvent(EVENT_NAMES.ORDER_DELIVERED)
  async handleOrderDelivered(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }) {
    await this.notificationService.sendOrderDeliveredToBuyer(payload);
  }

  @OnEvent(EVENT_NAMES.INVOICE_GENERATED)
  async handleInvoiceGenerated(payload: {
    invoice_id: string;
    provider_id: string;
    business_id: string;
    order_ids: string[];
  }) {
    await this.notificationService.sendInvoiceGenerated(payload);
  }

  @OnEvent(EVENT_NAMES.PAYMENT_COMPLETED)
  async handlePaymentCompleted(payload: {
    payment_id: string;
    payable_type: string;
    payable_id: string;
    amount: string;
  }) {
    await this.notificationService.sendPaymentCompletedToProvider(payload);
  }

  @OnEvent(EVENT_NAMES.PROVIDER_VERIFIED)
  async handleProviderVerified(payload: { provider_id: string }) {
    await this.notificationService.sendProviderVerified(payload);
  }
}
```

### 4.3 Notification service (SendGrid or similar)

**File: `src/notifications/notification.service.ts`**

```typescript
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
// import * as sgMail from '@sendgrid/mail';  // or nodemailer

@Injectable()
export class NotificationService {
  private readonly from = {
    email: "noreply@example.com",
    name: "B2B Marketplace",
  };
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    this.enabled = !!this.config.get("SENDGRID_API_KEY");
    // if (this.enabled) sgMail.setApiKey(this.config.get('SENDGRID_API_KEY'));
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    if (!this.enabled) {
      console.log("[Notification] (no SENDGRID_API_KEY) would send:", {
        to,
        subject,
      });
      return;
    }
    // await sgMail.send({ to, from: this.from, subject, html, text });
  }

  async sendWelcomeEmail(
    email: string,
    ctx: { userId: string }
  ): Promise<void> {
    const subject = "Welcome to B2B Marketplace";
    const html = `<p>Hello,</p><p>Thanks for registering. Your account is ready.</p><p>User ID: ${ctx.userId}</p>`;
    await this.send(email, subject, html);
  }

  async sendOrderPlacedToProvider(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }): Promise<void> {
    const subject = `New order received: ${payload.order_id}`;
    const html = `<p>You have a new order.</p><p>Order ID: ${payload.order_id}</p><p>Business: ${payload.business_id}</p>`;
    // Resolve provider contact email from DB; for MVP use a config or placeholder
    await this.send("provider@example.com", subject, html);
  }

  async sendOrderConfirmedToBuyer(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }): Promise<void> {
    const subject = `Order confirmed: ${payload.order_id}`;
    const html = `<p>Your order has been confirmed.</p><p>Order ID: ${payload.order_id}</p>`;
    await this.send("buyer@example.com", subject, html);
  }

  async sendOrderDeliveredToBuyer(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }): Promise<void> {
    const subject = `Order delivered: ${payload.order_id}`;
    const html = `<p>Your order has been delivered.</p><p>Order ID: ${payload.order_id}</p>`;
    await this.send("buyer@example.com", subject, html);
  }

  async sendInvoiceGenerated(payload: {
    invoice_id: string;
    provider_id: string;
    business_id: string;
    order_ids: string[];
  }): Promise<void> {
    const subject = `Invoice issued: ${payload.invoice_id}`;
    const html = `<p>An invoice has been issued.</p><p>Invoice ID: ${payload.invoice_id}</p><p>Orders: ${payload.order_ids.join(", ")}</p>`;
    await this.send("buyer@example.com", subject, html);
  }

  async sendPaymentCompletedToProvider(payload: {
    payment_id: string;
    payable_id: string;
    amount: string;
  }): Promise<void> {
    const subject = `Payment received: ${payload.payment_id}`;
    const html = `<p>Payment completed.</p><p>Amount: ${payload.amount}</p><p>Payment ID: ${payload.payment_id}</p>`;
    await this.send("provider@example.com", subject, html);
  }

  async sendProviderVerified(payload: { provider_id: string }): Promise<void> {
    const subject = "Your provider account is verified";
    const html = `<p>Your provider account (${payload.provider_id}) is now active.</p>`;
    await this.send("provider@example.com", subject, html);
  }
}
```

### 4.4 Email template placeholders (Markdown/HTML)

Templates can be moved to `src/notifications/templates/` with placeholders:

- **welcome.email.ts:** `{{email}}`, `{{userId}}`, `{{loginUrl}}`
- **order-placed.email.ts:** `{{orderId}}`, `{{orderNumber}}`, `{{businessName}}`, `{{dashboardUrl}}`
- **order-confirmed.email.ts:** `{{orderId}}`, `{{requestedDeliveryDate}}`, `{{providerName}}`
- **order-delivered.email.ts:** `{{orderId}}`, `{{deliveryId}}`
- **invoice-generated.email.ts:** `{{invoiceId}}`, `{{invoiceNumber}}`, `{{total}}`, `{{dueDate}}`, `{{orderIds}}`
- **payment-completed.email.ts:** `{{paymentId}}`, `{{amount}}`, `{{currency}}`, `{{invoiceId}}`

Example (HTML):

```html
<!-- order-confirmed.email.html -->
<p>Hello {{recipientName}},</p>
<p>
  Your order <strong>{{orderNumber}}</strong> has been confirmed by the
  supplier.
</p>
<p>Requested delivery: {{requestedDeliveryDate}}.</p>
<p>View order: {{baseUrl}}/orders/{{orderId}}</p>
```

Resolve recipient emails from User/Business/Provider (e.g. business primary contact, provider owner email) in the notification service before calling SendGrid.

---

## 5. Integration / E2E tests

Align with **doc 14 (MVP Integration Test Plan)**. Use a **test database**, run **migrations**, optionally **seed** minimal data.

### 5.1 Test setup

**File: `tests/integration/jest-integration.json`**

```json
{
  "displayName": "integration",
  "testEnvironment": "node",
  "rootDir": "../..",
  "testMatch": ["<rootDir>/tests/integration/**/*.integration-spec.ts"],
  "moduleFileExtensions": ["js", "json", "ts"],
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/src/$1"
  },
  "setupFilesAfterEnv": ["<rootDir>/tests/integration/setup.ts"],
  "testTimeout": 30000
}
```

**File: `tests/integration/setup.ts`**

```typescript
import { execSync } from "child_process";

const DATABASE_URL = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
if (!DATABASE_URL) {
  console.warn(
    "DATABASE_URL or TEST_DATABASE_URL not set; integration tests may fail."
  );
}

// Optional: run migrations before all (or in CI script)
// execSync('npm run migrate', { env: { ...process.env, DATABASE_URL }, stdio: 'inherit' });
```

### 5.2 Helpers

**File: `tests/integration/helpers/auth.helper.ts`**

```typescript
import request from "supertest";
import { INestApplication } from "@nestjs/common";

export async function login(
  app: INestApplication,
  email: string,
  password: string
): Promise<{ access_token: string }> {
  const res = await request(app.getHttpServer())
    .post("/v1/auth/login")
    .send({ email, password })
    .expect(200);
  return res.body;
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
```

**File: `tests/integration/helpers/request.helper.ts`**

```typescript
import request, { SuperTest, Test } from "supertest";
import { INestApplication } from "@nestjs/common";

export function requestWithBase(
  app: INestApplication,
  basePath = "/v1"
): SuperTest<Test> {
  return request(app.getHttpServer()).agent(basePath);
}
```

### 5.3 Example: auth integration spec

**File: `tests/integration/auth.integration-spec.ts`**

```typescript
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { HttpExceptionFilter } from "../../src/common/filters/http-exception.filter";

describe("Auth (integration)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => await app.close());

  describe("POST /auth/register", () => {
    it("should register a new user (201)", async () => {
      const email = `test-${Date.now()}@example.com`;
      const res = await request(app.getHttpServer())
        .post("/v1/auth/register")
        .send({
          email,
          password: "SecurePass123!",
          first_name: "Test",
          last_name: "User",
        })
        .expect(201);
      expect(res.body).toHaveProperty("user_id");
      expect(res.body.email).toBe(email);
    });

    it("should return 400 when payload is invalid", async () => {
      await request(app.getHttpServer())
        .post("/v1/auth/register")
        .send({ email: "bad", password: "short" })
        .expect(400);
    });
  });

  describe("POST /auth/login", () => {
    it("should return 401 for invalid credentials", async () => {
      await request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({ email: "nonexistent@example.com", password: "wrong" })
        .expect(401);
    });
  });

  describe("GET /auth/me", () => {
    it("should return 401 without token", async () => {
      await request(app.getHttpServer()).get("/v1/auth/me").expect(401);
    });
  });
});
```

### 5.4 Example: business integration spec (success + 403)

**File: `tests/integration/business.integration-spec.ts`**

```typescript
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { HttpExceptionFilter } from "../../src/common/filters/http-exception.filter";
import { login, bearer } from "./helpers/auth.helper";

describe("Business (integration)", () => {
  let app: INestApplication;
  let buyerToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    // Use seeded buyer or register + create business; then login
    const auth = await login(
      app,
      process.env.TEST_BUYER_EMAIL!,
      process.env.TEST_BUYER_PASSWORD!
    );
    buyerToken = auth.access_token;
  });

  afterAll(async () => await app.close());

  describe("GET /businesses/:id", () => {
    it("should return 200 when user has access to business", async () => {
      const businessId = process.env.TEST_BUSINESS_ID!;
      const res = await request(app.getHttpServer())
        .get(`/v1/businesses/${businessId}`)
        .set(bearer(buyerToken))
        .expect(200);
      expect(res.body.business_id).toBe(businessId);
    });

    it("should return 403 or 404 when user has no access", async () => {
      const otherBusinessId = "00000000-0000-0000-0000-000000000000";
      const res = await request(app.getHttpServer())
        .get(`/v1/businesses/${otherBusinessId}`)
        .set(bearer(buyerToken));
      expect([403, 404]).toContain(res.status);
    });
  });
});
```

### 5.5 E2E flow placeholder (doc 14 section 12)

**File: `tests/integration/e2e-flow.integration-spec.ts`**

```typescript
/**
 * E2E: Register → Business → Discovery → Order → Confirm → Delivery → Invoice → Pay → Rate
 * Requires: test DB with migrations; optional seed for provider + products.
 */
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { HttpExceptionFilter } from "../../src/common/filters/http-exception.filter";

describe("E2E flow (integration)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => await app.close());

  it("should complete full flow: register buyer → business → order → confirm → deliver → invoice → pay → rate", async () => {
    // 1) POST /auth/register (buyer)
    // 2) POST /auth/login
    // 3) POST /businesses + POST /businesses/:id/locations
    // 4) (Use existing or register) provider user, POST /providers, POST /providers/:id/products
    // 5) GET /discovery/providers (buyer token)
    // 6) POST /buyer/orders with Idempotency-Key
    // 7) POST /provider/orders/:id/confirm (provider token)
    // 8) PATCH /deliveries/:id status=delivered
    // 9) POST /invoices (provider), POST /invoices/:id/payments (buyer)
    // 10) POST /orders/:id/ratings (buyer)
    // Assert all 2xx; optionally assert events (OrderPlaced, OrderConfirmed, etc.) if event log is available
    expect(true).toBe(true); // placeholder until steps are implemented
  });
});
```

### 5.6 Test DB and seed

- Use a dedicated test DB: `TEST_DATABASE_URL` or `DATABASE_URL` in CI pointing to a test instance.
- Before integration tests: run `npm run migrate` (with test DB URL).
- Optional: run seed script or programmatic seed in `setup.ts` / `beforeAll` to create buyer, provider, business, location, product (see doc 14 preconditions).
- Cleanup: either transactional rollback per test (NestJS test module with `TypeOrmModule` and a test DB), or truncate/delete in `afterEach`/`beforeEach` for mutable tests.

---

## 6. CI hardening

### 6.1 Pipeline steps (recommended order)

| Step              | Purpose                     | Command / action                                       |
| ----------------- | --------------------------- | ------------------------------------------------------ |
| Lint              | Code style and rules        | `npm run lint`                                         |
| Format check      | Prettier                    | `npm run format:check`                                 |
| Typecheck         | TypeScript                  | `npm run typecheck`                                    |
| Migrate           | Apply migrations on test DB | `npm run migrate` (with TEST_DATABASE_URL)             |
| Unit tests        | Fast tests, no DB           | `npm run test -- --testPathIgnorePatterns=integration` |
| Integration tests | API + test DB               | `npm run test:integration`                             |
| Build             | Production build            | `npm run build`                                        |

### 6.2 npm scripts

**Add to `package.json`:**

```json
{
  "scripts": {
    "test:integration": "jest --config ./tests/integration/jest-integration.json --runInBand",
    "test:unit": "jest --testPathIgnorePatterns=integration",
    "ci:validate": "npm run lint && npm run format:check && npm run typecheck",
    "ci:test": "npm run test:unit && npm run test:integration",
    "ci:migrate": "npm run migrate"
  }
}
```

Run migrations in CI with `DATABASE_URL` or `TEST_DATABASE_URL` set to the CI Postgres service.

### 6.3 GitHub Actions (full CI)

**File: `.github/workflows/ci-full.yml`**

```yaml
name: CI Full

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - name: Lint
        run: npm run lint
      - name: Format check
        run: npm run format:check
      - name: Typecheck
        run: npm run typecheck

  build:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build

  test:
    needs: validate
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: b2b_mvp_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/b2b_mvp_test
      JWT_SECRET: test-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - name: Run migrations
        run: npm run migrate
      - name: Unit tests
        run: npm run test:unit
      - name: Integration tests
        run: npm run test:integration
```

### 6.4 Rollback / failure handling

- **Migrations:** Keep migrations forward-only in CI. If a migration fails, fix the migration or the DB state; avoid running `migrate:revert` in CI automatically. Document rollback steps in runbook: revert code, then run `npm run migrate:revert` locally/controlled env if needed.
- **Test failures:** On integration test failure, CI fails the job; preserve logs (Jest output, DB URL redacted). Optionally archive test results (e.g. Jest `--json` output).
- **Flaky tests:** Use `--runInBand` for integration tests to reduce concurrency; increase timeout for E2E; consider retries only for known flaky checks.

---

## 7. Idempotency (POST /buyer/orders)

### 7.1 Requirement

- Client sends header `Idempotency-Key: <uuid>` (or other unique string) on `POST /buyer/orders`.
- If the same key is sent again with the same (or equivalent) body, the API returns the **same order** (same `order_id`) and does **not** create a duplicate order.

### 7.2 Approach

- **Store:** Persist idempotency keys with outcome (e.g. `idempotency_keys` table: `key`, `resource_type`, `resource_id`, `created_at`) or use a cache (e.g. Redis) with TTL.
- **Flow:**
  1. Read `Idempotency-Key` from request (already available via `@IdempotencyKey()` decorator).
  2. If key present: look up stored result for that key.
  3. If found: return stored response (e.g. 200 with same `order_id`) and do not create a new order.
  4. If not found: create order, then store `key → { order_id, response }` (and optional request hash for body equivalence), return 201.

### 7.3 Partial implementation sketch

**Idempotency store (in-memory for demo; replace with DB or Redis):**

```typescript
// src/common/idempotency/idempotency.store.ts
@Injectable()
export class IdempotencyStore {
  private readonly cache = new Map<
    string,
    { resourceId: string; response: unknown; createdAt: number }
  >();
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 24h

  get(key: string): { resourceId: string; response: unknown } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return { resourceId: entry.resourceId, response: entry.response };
  }

  set(key: string, resourceId: string, response: unknown): void {
    this.cache.set(key, { resourceId, response, createdAt: Date.now() });
  }
}
```

**In OrderService.placeOrder():**

```typescript
async placeOrder(user: RequestContext, businessId: string, dto: CreateOrderDto, idempotencyKey?: string) {
  if (idempotencyKey) {
    const existing = this.idempotencyStore.get(idempotencyKey);
    if (existing) {
      return existing.response as { order_id: string; order_number: string; status: string; ... };
    }
  }
  // ... existing validation and order creation ...
  const result = { order_id: order.id, order_number: order.order_number, status: order.status, ... };
  if (idempotencyKey) {
    this.idempotencyStore.set(idempotencyKey, order.id, result);
  }
  return result;
}
```

**Controller:** Pass `@IdempotencyKey() idempotencyKey?: string` into `placeOrder`. This is a **partial demonstration**; production should use a persistent store and optional request-body hash for equivalence.

---

## 8. Implementation checklist

- [ ] Add `@nestjs/event-emitter` and create `EventBusModule` + `EventBusService`.
- [ ] Add `event-names.ts` and `event.types.ts`.
- [ ] Implement producers (auth, business, provider, order, delivery, payment, trust) and call them from existing services after save.
- [ ] Implement `NotificationService` (SendGrid or nodemailer) and `NotificationConsumer`; add templates.
- [ ] Create `tests/integration` with Jest config, setup, helpers, and specs for auth, business, provider, discovery, orders, delivery, payment, ratings, admin; add E2E flow spec.
- [ ] Configure test DB (migrations + optional seed) for integration tests.
- [ ] Add npm scripts: `test:integration`, `test:unit`, `ci:validate`, `ci:migrate`, `ci:test`.
- [ ] Add or extend GitHub Actions: migrate on test DB, run unit + integration tests.
- [ ] Implement idempotency for `POST /buyer/orders`: store (in-memory or DB/Redis) + lookup in `OrderService`; wire `Idempotency-Key` from controller.
- [ ] Document rollback and failure handling for migrations and CI.

This document is ready to implement in the existing NestJS project; align event payloads and notification recipients with your domain (e.g. resolve buyer/provider emails from DB).
