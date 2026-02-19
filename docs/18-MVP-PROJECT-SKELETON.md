# MVP NestJS/TypeScript Project Skeleton

## Ready to install dependencies and start coding

Aligned with API Skeleton (12), DB Schema (13), Event Flow (10), Permission Model (08), and Service Boundaries (09). MVP only; backend only.

---

## 1. Project structure (folder tree)

```
b2b-mvp/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── app.config.ts
│   │   └── events.config.ts
│   │
│   ├── common/
│   │   ├── common.module.ts
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── id-param.dto.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── idempotency.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   ├── scope.decorator.ts
│   │   │   └── idempotency-key.decorator.ts
│   │   └── interfaces/
│   │       └── request-context.interface.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-auth.guard.ts
│   │   ├── guards/
│   │   │   ├── roles.guard.ts
│   │   │   ├── business-scope.guard.ts
│   │   │   └── provider-scope.guard.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── refresh.dto.ts
│   │   └── resolvers/
│   │       └── principal.resolver.ts
│   │
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── business-user.entity.ts
│   │   ├── provider-user.entity.ts
│   │   ├── session.entity.ts
│   │   ├── business.entity.ts
│   │   ├── location.entity.ts
│   │   ├── preferred-supplier.entity.ts
│   │   ├── provider.entity.ts
│   │   ├── product.entity.ts
│   │   ├── availability.entity.ts
│   │   ├── order.entity.ts
│   │   ├── order-line.entity.ts
│   │   ├── delivery.entity.ts
│   │   ├── invoice.entity.ts
│   │   ├── invoice-line.entity.ts
│   │   ├── payment.entity.ts
│   │   └── rating.entity.ts
│   │
│   ├── modules/
│   │   ├── business/
│   │   │   ├── business.module.ts
│   │   │   ├── business.controller.ts
│   │   │   ├── business.service.ts
│   │   │   └── dto/
│   │   │       ├── create-business.dto.ts
│   │   │       ├── update-business.dto.ts
│   │   │       └── create-location.dto.ts
│   │   │
│   │   ├── provider/
│   │   │   ├── provider.module.ts
│   │   │   ├── provider.controller.ts
│   │   │   ├── provider.service.ts
│   │   │   └── dto/
│   │   │       ├── create-provider.dto.ts
│   │   │       ├── update-provider.dto.ts
│   │   │       ├── create-product.dto.ts
│   │   │       ├── update-product.dto.ts
│   │   │       └── create-location.dto.ts
│   │   │
│   │   ├── discovery/
│   │   │   ├── discovery.module.ts
│   │   │   ├── discovery.controller.ts
│   │   │   └── discovery.service.ts
│   │   │
│   │   ├── order/
│   │   │   ├── order.module.ts
│   │   │   ├── buyer-orders.controller.ts
│   │   │   ├── provider-orders.controller.ts
│   │   │   ├── order.service.ts
│   │   │   └── dto/
│   │   │       ├── create-order.dto.ts
│   │   │       ├── confirm-order.dto.ts
│   │   │       └── update-order-status.dto.ts
│   │   │
│   │   ├── delivery/
│   │   │   ├── delivery.module.ts
│   │   │   ├── delivery.controller.ts
│   │   │   ├── delivery.service.ts
│   │   │   └── dto/
│   │   │       └── update-delivery.dto.ts
│   │   │
│   │   ├── payment/
│   │   │   ├── payment.module.ts
│   │   │   ├── invoice.controller.ts
│   │   │   ├── buyer-invoices.controller.ts
│   │   │   ├── provider-invoices.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── invoice.service.ts
│   │   │   ├── payment.service.ts
│   │   │   └── dto/
│   │   │       ├── create-invoice.dto.ts
│   │   │       └── initiate-payment.dto.ts
│   │   │
│   │   ├── trust/
│   │   │   ├── trust.module.ts
│   │   │   ├── rating.controller.ts
│   │   │   ├── rating.service.ts
│   │   │   └── dto/
│   │   │       └── create-rating.dto.ts
│   │   │
│   │   └── admin/
│   │       ├── admin.module.ts
│   │       ├── admin-users.controller.ts
│   │       ├── admin-businesses.controller.ts
│   │       ├── admin-providers.controller.ts
│   │       ├── admin-payouts.controller.ts
│   │       └── dto/
│   │           └── update-status.dto.ts
│   │
│   ├── events/
│   │   ├── events.module.ts
│   │   ├── event-bus.service.ts
│   │   ├── event-names.ts
│   │   ├── producers/
│   │   │   ├── auth-events.producer.ts
│   │   │   ├── business-events.producer.ts
│   │   │   ├── provider-events.producer.ts
│   │   │   ├── order-events.producer.ts
│   │   │   ├── delivery-events.producer.ts
│   │   │   ├── payment-events.producer.ts
│   │   │   └── trust-events.producer.ts
│   │   └── consumers/
│   │       ├── notification.consumer.ts
│   │       ├── delivery.consumer.ts
│   │       ├── order.consumer.ts
│   │       ├── payment.consumer.ts
│   │       ├── trust.consumer.ts
│   │       └── discovery.consumer.ts
│   │
│   ├── migrations/
│   │   ├── 1700000000001-InitialSchema.ts
│   │   └── run-migrations.ts
│   │
│   └── seeds/
│       ├── seed.module.ts
│       ├── seed.service.ts
│       ├── seed-mvp.sql
│       └── run-seed.ts
│
├── test/
│   ├── jest-e2e.json
│   ├── setup.ts
│   ├── integration/
│   │   ├── auth.e2e-spec.ts
│   │   ├── business.e2e-spec.ts
│   │   ├── provider.e2e-spec.ts
│   │   ├── discovery.e2e-spec.ts
│   │   ├── orders.e2e-spec.ts
│   │   ├── delivery.e2e-spec.ts
│   │   ├── payment.e2e-spec.ts
│   │   ├── ratings.e2e-spec.ts
│   │   └── admin.e2e-spec.ts
│   └── utils/
│       ├── test-db.ts
│       └── auth-helper.ts
│
└── scripts/
    ├── migrate.sh
    └── seed.sh
```

---

## 2. package.json (sample)

```json
{
  "name": "b2b-mvp-api",
  "version": "0.1.0",
  "description": "B2B Hospitality Marketplace MVP API",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"test/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json --runInBand",
    "migrate": "ts-node -r tsconfig-paths/register src/migrations/run-migrations.ts",
    "migrate:generate": "typeorm migration:generate -d src/config/typeorm-data-source.ts",
    "seed": "ts-node -r tsconfig-paths/register src/seeds/run-seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "pg": "^8.11.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0",
    "typeorm": "^0.3.17",
    "uuid": "^9.0.0",
    "bcrypt": "^5.1.0",
    "amqplib": "^0.10.3"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/express": "^4.17.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/supertest": "^2.0.0",
    "@types/uuid": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.0.0"
  }
}
```

**Note:** For event bus, `amqplib` is a placeholder; you can swap for `@nestjs/microservices` (TCP/RMQ), Redis (Bull/BullMQ), or an in-memory EventEmitter for MVP. Replace with `@nestjs/bull` + Redis if using Bull.

---

## 3. main.ts (bootstrap)

```typescript
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  return port;
}

bootstrap().then((port) => {
  console.log(`Application is running on: http://localhost:${port}/v1`);
});
```

---

## 4. app.module.ts (root)

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { configModuleOptions } from "./config/app.config";
import { typeOrmModuleOptions } from "./config/database.config";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { BusinessModule } from "./modules/business/business.module";
import { ProviderModule } from "./modules/provider/provider.module";
import { DiscoveryModule } from "./modules/discovery/discovery.module";
import { OrderModule } from "./modules/order/order.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { TrustModule } from "./modules/trust/trust.module";
import { AdminModule } from "./modules/admin/admin.module";
import { EventsModule } from "./events/events.module";

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    CommonModule,
    AuthModule,
    BusinessModule,
    ProviderModule,
    DiscoveryModule,
    OrderModule,
    DeliveryModule,
    PaymentModule,
    TrustModule,
    AdminModule,
    EventsModule,
  ],
})
export class AppModule {}
```

---

## 5. File placeholders (purpose)

### config/

| File               | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| config.module.ts   | Export ConfigModule.                                            |
| database.config.ts | TypeORM options (pg, entities, migrations, synchronize: false). |
| app.config.ts      | Port, global prefix, env validation.                            |
| events.config.ts   | Event bus URL (e.g. AMQP or Redis).                             |

### common/

| File                         | Purpose                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| pagination.dto.ts            | cursor, limit; response next_cursor, has_more.                                            |
| id-param.dto.ts              | UUID param validation (ParseUUIDPipe).                                                    |
| http-exception.filter.ts     | Map exceptions to { code, message, details }.                                             |
| idempotency.interceptor.ts   | Read Idempotency-Key header; delegate to service layer.                                   |
| validation.pipe.ts           | Use class-validator on DTOs (or use built-in ValidationPipe).                             |
| roles.decorator.ts           | @Roles('business_owner', 'business_manager').                                             |
| scope.decorator.ts           | @BusinessScope() / @ProviderScope() for resolving business_id/provider_id from principal. |
| idempotency-key.decorator.ts | @IdempotencyKey() for POST /buyer/orders, /invoices/:id/payments, /admin/payouts.         |
| request-context.interface.ts | user_id, memberships[] (business_id?, provider_id?, role).                                |

### auth/

| File                    | Purpose                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ |
| auth.controller.ts      | POST register, login, logout, refresh; GET me; POST forgot-password, reset-password. |
| auth.service.ts         | Register (emit UserRegistered), login (issue JWT), resolve principal.                |
| jwt.strategy.ts         | Validate JWT; load user + memberships; attach to request.                            |
| jwt-auth.guard.ts       | Require valid JWT.                                                                   |
| roles.guard.ts          | Check user role against @Roles().                                                    |
| business-scope.guard.ts | Resolve business_id from membership; 403 if no business.                             |
| provider-scope.guard.ts | Resolve provider_id from membership; 403 if no provider.                             |
| principal.resolver.ts   | getPrincipal(req): RequestContext (used by scope guards and services).               |

### entities/

| File                         | Purpose                                       |
| ---------------------------- | --------------------------------------------- |
| user.entity.ts               | Map to users (doc 13).                        |
| business-user.entity.ts      | business_users.                               |
| provider-user.entity.ts      | provider_users.                               |
| session.entity.ts            | sessions.                                     |
| business.entity.ts           | businesses.                                   |
| location.entity.ts           | locations (owner_type, owner_id polymorphic). |
| preferred-supplier.entity.ts | preferred_suppliers.                          |
| provider.entity.ts           | providers.                                    |
| product.entity.ts            | products.                                     |
| availability.entity.ts       | availability.                                 |
| order.entity.ts              | orders.                                       |
| order-line.entity.ts         | order_lines.                                  |
| delivery.entity.ts           | deliveries.                                   |
| invoice.entity.ts            | invoices.                                     |
| invoice-line.entity.ts       | invoice_lines.                                |
| payment.entity.ts            | payments.                                     |
| rating.entity.ts             | ratings.                                      |

Entity definitions must match `docs/13-MVP-DB-SCHEMA.md` (table names, columns, relations). Use TypeORM decorators: `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn('uuid')`, `@ManyToOne()`, `@OneToMany()`.

### modules/business/

| File                   | Purpose                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| business.controller.ts | POST/GET/PATCH /businesses, GET/POST /businesses/:id/locations. Guards: JwtAuthGuard, RolesGuard (BO,BM,BS), BusinessScopeGuard. |
| business.service.ts    | CRUD business + locations (owner_type=business); emit BusinessCreated on create.                                                 |

### modules/provider/

| File                   | Purpose                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| provider.controller.ts | POST/GET/PATCH /providers, GET/POST/PATCH /providers/:id/products, GET/POST /providers/:id/locations. Guards: JwtAuthGuard, RolesGuard (PO,PM,PS), ProviderScopeGuard. |
| provider.service.ts    | CRUD provider, products, locations (owner_type=provider); emit ProviderVerified, ProductCreated.                                                                       |

### modules/discovery/

| File                    | Purpose                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| discovery.controller.ts | GET /discovery/providers, /discovery/providers/:id, /discovery/providers/:id/products. Guard: JwtAuthGuard + buyer role (BO,BM,BS). |
| discovery.service.ts    | Query providers/products (read-only); optional search index.                                                                        |

### modules/order/

| File                          | Purpose                                                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| buyer-orders.controller.ts    | POST /buyer/orders (IdempotencyKey), GET /buyer/orders, GET /buyer/orders/:id, POST /buyer/orders/:id/cancel. Scope by business_id.                                    |
| provider-orders.controller.ts | GET /provider/orders, GET /provider/orders/:id, POST /provider/orders/:id/confirm, POST /provider/orders/:id/reject, PATCH /provider/orders/:id. Scope by provider_id. |
| order.service.ts              | Place order (validate location, products; emit OrderPlaced), confirm/reject/cancel, update status (emit OrderConfirmed, OrderPrepared, OrderDispatched).               |

### modules/delivery/

| File                   | Purpose                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| delivery.controller.ts | GET /deliveries/:id, PATCH /deliveries/:id. Guard: buyer read; provider write (PO,PM,PS).                                |
| delivery.service.ts    | Create delivery (on OrderConfirmed consumer or internal call), update status; emit OrderDelivered when status=delivered. |

### modules/payment/

| File                            | Purpose                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| invoice.controller.ts           | POST /invoices, GET /invoices/:id.                                                           |
| buyer-invoices.controller.ts    | GET /buyer/invoices. Scope by business_id.                                                   |
| provider-invoices.controller.ts | GET /provider/invoices. Scope by provider_id.                                                |
| payment.controller.ts           | POST /invoices/:id/payments (IdempotencyKey), GET /payments.                                 |
| invoice.service.ts              | Create/issue invoice; emit InvoiceGenerated.                                                 |
| payment.service.ts              | Initiate payment (Stripe redirect), handle webhook; emit PaymentInitiated, PaymentCompleted. |

### modules/trust/

| File                 | Purpose                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| rating.controller.ts | POST /orders/:id/ratings. Guard: JwtAuthGuard, buyer role, order belongs to business. |
| rating.service.ts    | Create rating; emit RatingSubmitted.                                                  |

### modules/admin/

| File                           | Purpose                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| admin-users.controller.ts      | GET /admin/users, PATCH /admin/users/:id. Guard: RolesGuard (PA, POps).                   |
| admin-businesses.controller.ts | GET /admin/businesses, PATCH /admin/businesses/:id.                                       |
| admin-providers.controller.ts  | GET /admin/providers, PATCH /admin/providers/:id (emit ProviderVerified when set active). |
| admin-payouts.controller.ts    | POST /admin/payouts (IdempotencyKey). Guard: RolesGuard (PA, PFin).                       |

### events/

| File                        | Purpose                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------- |
| event-bus.service.ts        | Abstract publish(eventType, payload); implement with EventEmitter2, RabbitMQ, or Redis. |
| event-names.ts              | Constants: USER_REGISTERED, BUSINESS_CREATED, ORDER_PLACED, etc.                        |
| auth-events.producer.ts     | Emit UserRegistered after register.                                                     |
| business-events.producer.ts | Emit BusinessCreated.                                                                   |
| provider-events.producer.ts | Emit ProviderVerified, ProductCreated.                                                  |
| order-events.producer.ts    | Emit OrderPlaced, OrderConfirmed, OrderPrepared, OrderDispatched.                       |
| delivery-events.producer.ts | Emit OrderDelivered when delivery status=delivered.                                     |
| payment-events.producer.ts  | Emit InvoiceGenerated, PaymentInitiated, PaymentCompleted, PayoutExecuted.              |
| trust-events.producer.ts    | Emit RatingSubmitted.                                                                   |
| notification.consumer.ts    | Subscribe to \*; send email (template + preferences).                                   |
| delivery.consumer.ts        | On OrderConfirmed: create delivery record.                                              |
| order.consumer.ts           | On OrderDelivered: set order status delivered.                                          |
| payment.consumer.ts         | On OrderDelivered: optional auto-invoice.                                               |
| trust.consumer.ts           | On OrderDelivered: mark rateable; update on-time metric.                                |
| discovery.consumer.ts       | On ProviderVerified, ProductCreated: update search index.                               |

---

## 6. Migrations and seeding

### Migrations

- **Location:** `src/migrations/`.
- **Naming:** `{timestamp}-Description.ts` (e.g. `1700000000001-InitialSchema.ts`).
- **Content:** Use TypeORM migration API: `queryRunner.createTable()`, `queryRunner.addColumn()`, etc. Mirror `docs/13-MVP-DB-SCHEMA.md` (CREATE TABLE and ALTER TABLE in order of FK dependencies).
- **run-migrations.ts:** Bootstrap TypeORM DataSource with migrations array; run `dataSource.runMigrations()`.

### Seeding

- **Option A:** Raw SQL in `src/seeds/seed-mvp.sql` (copy from `docs/15-MVP-CI-CD-SEED.md` section 5 / `docs/13-MVP-DB-SCHEMA.md` seed). Run via `psql $DATABASE_URL -f src/seeds/seed-mvp.sql` or `npm run seed` that executes the SQL.
- **Option B:** `seed.service.ts` that uses TypeORM repos to insert same data with fixed UUIDs; idempotent by checking existence (e.g. findOne by email/id) before insert. `run-seed.ts` creates Nest app context, gets SeedService, calls `seedService.run()`.

Both approaches must be **idempotent** (safe to run multiple times).

---

## 7. Controller route summary (MVP)

| Prefix                    | Controller                 | Routes                                                                  |
| ------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| /v1/auth                  | AuthController             | register, login, logout, refresh, me, forgot-password, reset-password   |
| /v1/businesses            | BusinessController         | POST/GET/PATCH /, GET/POST /:id/locations                               |
| /v1/providers             | ProviderController         | POST/GET/PATCH /, GET/POST/PATCH /:id/products, GET/POST /:id/locations |
| /v1/discovery             | DiscoveryController        | GET /providers, GET /providers/:id, GET /providers/:id/products         |
| /v1/buyer/orders          | BuyerOrdersController      | POST /, GET /, GET /:id, POST /:id/cancel                               |
| /v1/provider/orders       | ProviderOrdersController   | GET /, GET /:id, POST /:id/confirm, POST /:id/reject, PATCH /:id        |
| /v1/deliveries            | DeliveryController         | GET /:id, PATCH /:id                                                    |
| /v1/invoices              | InvoiceController          | POST /, GET /:id                                                        |
| /v1/buyer/invoices        | BuyerInvoicesController    | GET /                                                                   |
| /v1/provider/invoices     | ProviderInvoicesController | GET /                                                                   |
| /v1/invoices/:id/payments | PaymentController (nested) | POST /                                                                  |
| /v1/payments              | PaymentController          | GET /                                                                   |
| /v1/orders/:id/ratings    | RatingController           | POST /                                                                  |
| /v1/admin                 | Admin\*Controllers         | GET/PATCH /users, /businesses, /providers, POST /payouts                |

---

## 8. Quick start (after creating skeleton)

```bash
# Install dependencies
npm install

# Copy env
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, etc.

# Run migrations
npm run migrate

# Seed (optional)
npm run seed

# Start
npm run start:dev
```

---

## 9. References

| Doc                         | Use                                                |
| --------------------------- | -------------------------------------------------- |
| 12-MVP-API-SKELETON.md      | Endpoints, request/response fields, roles, events. |
| 13-MVP-DB-SCHEMA.md         | Table definitions, CREATE TABLE, seed SQL.         |
| 10-EVENT-FLOW-MODEL.md      | Event names, producers, consumers.                 |
| 08-PERMISSION-MODEL.md      | Roles, scopes, permissions per endpoint.           |
| 14-MVP-INTEGRATION-TESTS.md | E2E test scenarios.                                |
| 15-MVP-CI-CD-SEED.md        | Migrate/seed scripts, CI steps.                    |
