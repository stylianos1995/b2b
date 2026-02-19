# Phase 2a: MVP Entities, Migrations, and Seed

**Goal:** Add all MVP entities, one initial migration, and idempotent seed scripts. Entities match `docs/13-MVP-DB-SCHEMA.md`; seed matches `docs/15-MVP-CI-CD-SEED.md`. No Service entity in MVP (schema 13 defines products + availability only).

---

## 1. Folder structure

```
src/
├── entities/
│   ├── user.entity.ts
│   ├── business-user.entity.ts
│   ├── provider-user.entity.ts
│   ├── session.entity.ts
│   ├── business.entity.ts
│   ├── location.entity.ts
│   ├── preferred-supplier.entity.ts
│   ├── provider.entity.ts
│   ├── product.entity.ts
│   ├── availability.entity.ts
│   ├── order.entity.ts
│   ├── order-line.entity.ts
│   ├── delivery.entity.ts
│   ├── invoice.entity.ts
│   ├── invoice-line.entity.ts
│   ├── payment.entity.ts
│   └── rating.entity.ts
├── migrations/
│   ├── 1738500000001-InitialMvpSchema.ts   # TypeORM migration
│   └── run-migrations.ts                   # Runner script (optional)
└── seeds/
    ├── seed.module.ts
    ├── seed.service.ts
    ├── seed-mvp.sql                         # Idempotent SQL seed
    └── run-seed.ts                          # Runner (optional)
```

---

## 2. Entity ownership (service boundaries)

| Entity            | Table               | Owner service       |
| ----------------- | ------------------- | ------------------- |
| User              | users               | Identity            |
| BusinessUser      | business_users      | Identity            |
| ProviderUser      | provider_users      | Identity            |
| Session           | sessions            | Identity            |
| Business          | businesses          | Business            |
| Location          | locations           | Business / Provider |
| PreferredSupplier | preferred_suppliers | Business            |
| Provider          | providers           | Provider            |
| Product           | products            | Provider            |
| Availability      | availability        | Provider            |
| Order             | orders              | Order               |
| OrderLine         | order_lines         | Order               |
| Delivery          | deliveries          | Logistics           |
| Invoice           | invoices            | Payment             |
| InvoiceLine       | invoice_lines       | Payment             |
| Payment           | payments            | Payment             |
| Rating            | ratings             | Trust               |

---

## 3. Entities (TypeORM)

Column names and types align with `docs/13-MVP-DB-SCHEMA.md`. CHECK constraints are enforced in the migration; entities use plain string/number types.

### 3.1 User

```typescript
// src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { BusinessUser } from "./business-user.entity";
import { ProviderUser } from "./provider-user.entity";
import { Session } from "./session.entity";

/** @owner Identity Service */
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string | null;

  @Column({ type: "varchar", length: 255 })
  password_hash: string;

  @Column({ type: "varchar", length: 100 })
  first_name: string;

  @Column({ type: "varchar", length: 100 })
  last_name: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  avatar_url: string | null;

  @Column({ type: "timestamptz", nullable: true })
  email_verified_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  phone_verified_at: Date | null;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status: string;

  @Column({ type: "varchar", length: 10, default: "en_GB" })
  locale: string;

  @Column({ type: "varchar", length: 50, default: "UTC" })
  timezone: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @OneToMany(() => BusinessUser, (bu) => bu.user)
  businessMemberships: BusinessUser[];

  @OneToMany(() => ProviderUser, (pu) => pu.user)
  providerMemberships: ProviderUser[];

  @OneToMany(() => Session, (s) => s.user)
  sessions: Session[];
}
```

### 3.2 BusinessUser

```typescript
// src/entities/business-user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Business } from "./business.entity";

/** @owner Identity Service */
@Entity("business_users")
@Unique(["user_id", "business_id"])
@Index(["business_id"])
export class BusinessUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "varchar", length: 30 })
  role: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Business, { onDelete: "CASCADE" })
  @JoinColumn({ name: "business_id" })
  business: Business;
}
```

### 3.3 ProviderUser

```typescript
// src/entities/provider-user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Provider } from "./provider.entity";

/** @owner Identity Service */
@Entity("provider_users")
@Unique(["user_id", "provider_id"])
@Index(["provider_id"])
export class ProviderUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "varchar", length: 30 })
  role: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;
}
```

### 3.4 Session

```typescript
// src/entities/session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

/** @owner Identity Service */
@Entity("sessions")
@Index(["user_id"])
@Index(["token_hash"])
@Index(["expires_at"])
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "varchar", length: 255 })
  token_hash: string;

  @Column({ type: "timestamptz" })
  expires_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
```

### 3.5 Business

```typescript
// src/entities/business.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Location } from "./location.entity";
import { BusinessUser } from "./business-user.entity";
import { PreferredSupplier } from "./preferred-supplier.entity";

/** @owner Business Service */
@Entity("businesses")
@Index(["status"])
export class Business {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  legal_name: string;

  @Column({ type: "varchar", length: 255 })
  trading_name: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  registration_number: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  tax_id: string | null;

  @Column({ type: "varchar", length: 30 })
  business_type: string;

  @Column({ type: "varchar", length: 30, default: "pending_verification" })
  status: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  logo_url: string | null;

  @Column({ type: "varchar", length: 3, default: "GBP" })
  default_currency: string;

  @Column({ type: "uuid", nullable: true })
  default_delivery_address_id: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Location, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "default_delivery_address_id" })
  defaultDeliveryAddress: Location | null;

  @OneToMany(() => BusinessUser, (bu) => bu.business)
  userMemberships: BusinessUser[];

  @OneToMany(() => PreferredSupplier, (ps) => ps.business)
  preferredSuppliers: PreferredSupplier[];
}
```

### 3.6 Location

```typescript
// src/entities/location.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/** @owner Business Service (owner_type=business) / Provider Service (owner_type=provider) */
@Entity("locations")
@Index(["owner_type", "owner_id"])
@Index(["postal_code"])
export class Location {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  address_line_1: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  address_line_2: string | null;

  @Column({ type: "varchar", length: 100 })
  city: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  region: string | null;

  @Column({ type: "varchar", length: 20 })
  postal_code: string;

  @Column({ type: "varchar", length: 2 })
  country: string;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude: string | null;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude: string | null;

  @Column({ type: "varchar", length: 30 })
  location_type: string;

  @Column({ type: "varchar", length: 20 })
  owner_type: string;

  @Column({ type: "uuid" })
  owner_id: string;

  @Column({ type: "boolean", default: false })
  is_default: boolean;

  @Column({ type: "varchar", length: 100, nullable: true })
  contact_name: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  contact_phone: string | null;

  @Column({ type: "text", nullable: true })
  delivery_instructions: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
```

### 3.7 PreferredSupplier

```typescript
// src/entities/preferred-supplier.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { Business } from "./business.entity";
import { Provider } from "./provider.entity";

/** @owner Business Service */
@Entity("preferred_suppliers")
@Unique(["business_id", "provider_id"])
@Index(["provider_id"])
export class PreferredSupplier {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Business, { onDelete: "CASCADE" })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;
}
```

### 3.8 Provider

```typescript
// src/entities/provider.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { ProviderUser } from "./provider-user.entity";
import { Product } from "./product.entity";
import { Availability } from "./availability.entity";

/** @owner Provider Service */
@Entity("providers")
@Index(["status"])
@Index(["provider_type"])
export class Provider {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  legal_name: string;

  @Column({ type: "varchar", length: 255 })
  trading_name: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  registration_number: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  tax_id: string | null;

  @Column({ type: "varchar", length: 50 })
  provider_type: string;

  @Column({ type: "varchar", length: 30, default: "pending_verification" })
  status: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  logo_url: string | null;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 3, default: "GBP" })
  default_currency: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  min_order_value: string | null;

  @Column({ type: "int", nullable: true })
  lead_time_hours: number | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  service_radius_km: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @OneToMany(() => ProviderUser, (pu) => pu.provider)
  userMemberships: ProviderUser[];

  @OneToMany(() => Product, (p) => p.provider)
  products: Product[];

  @OneToMany(() => Availability, (a) => a.provider)
  availability: Availability[];
}
```

### 3.9 Product

```typescript
// src/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { Provider } from "./provider.entity";

/** @owner Provider Service */
@Entity("products")
@Unique(["provider_id", "sku"])
@Index(["provider_id", "is_active"])
@Index(["category"])
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "varchar", length: 100 })
  sku: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 50 })
  category: string;

  @Column({ type: "varchar", length: 20 })
  unit: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  unit_size: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price: string;

  @Column({ type: "varchar", length: 3 })
  currency: string;

  @Column({ type: "decimal", precision: 5, scale: 4 })
  tax_rate: string;

  @Column({ type: "decimal", precision: 12, scale: 3, nullable: true })
  min_order_quantity: string | null;

  @Column({ type: "decimal", precision: 12, scale: 3, nullable: true })
  max_order_quantity: string | null;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "jsonb", nullable: true })
  image_urls: string[] | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;
}
```

### 3.10 Availability

```typescript
// src/entities/availability.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Provider } from "./provider.entity";

/** @owner Provider Service */
@Entity("availability")
@Index(["provider_id"])
export class Availability {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "varchar", length: 30 })
  availability_type: string;

  @Column({ type: "int", nullable: true })
  day_of_week: number | null;

  @Column({ type: "time", nullable: true })
  start_time: string | null;

  @Column({ type: "time", nullable: true })
  end_time: string | null;

  @Column({ type: "date", nullable: true })
  valid_from: Date | null;

  @Column({ type: "date", nullable: true })
  valid_until: Date | null;

  @Column({ type: "jsonb", nullable: true })
  region_postcodes: string[] | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  radius_km: string | null;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;
}
```

### 3.11 Order

```typescript
// src/entities/order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Business } from "./business.entity";
import { Provider } from "./provider.entity";
import { Location } from "./location.entity";
import { OrderLine } from "./order-line.entity";
import { Delivery } from "./delivery.entity";
import { Rating } from "./rating.entity";

/** @owner Order Service */
@Entity("orders")
@Index(["business_id", "status", "created_at"])
@Index(["provider_id", "status"])
@Index(["order_number"], { unique: true })
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  order_number: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "uuid" })
  delivery_location_id: string;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  tax_total: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  delivery_fee: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total: string;

  @Column({ type: "varchar", length: 3 })
  currency: string;

  @Column({ type: "date" })
  requested_delivery_date: Date;

  @Column({ type: "time", nullable: true })
  requested_delivery_slot_start: string | null;

  @Column({ type: "time", nullable: true })
  requested_delivery_slot_end: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "text", nullable: true })
  internal_notes: string | null;

  @Column({ type: "timestamptz", nullable: true })
  submitted_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  confirmed_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  delivered_at: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  cancellation_reason: string | null;

  @Column({ type: "timestamptz", nullable: true })
  cancelled_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Business, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => Provider, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;

  @ManyToOne(() => Location, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "delivery_location_id" })
  deliveryLocation: Location;

  @OneToMany(() => OrderLine, (ol) => ol.order)
  orderLines: OrderLine[];

  @OneToOne(() => Delivery, (d) => d.order)
  delivery: Delivery;

  @OneToMany(() => Rating, (r) => r.order)
  ratings: Rating[];
}
```

### 3.12 OrderLine

```typescript
// src/entities/order-line.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Order } from "./order.entity";
import { Product } from "./product.entity";

/** @owner Order Service */
@Entity("order_lines")
@Index(["order_id"])
export class OrderLine {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  order_id: string;

  @Column({ type: "varchar", length: 20 })
  line_type: string;

  @Column({ type: "uuid", nullable: true })
  product_id: string | null;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "decimal", precision: 12, scale: 3 })
  quantity: string;

  @Column({ type: "varchar", length: 20 })
  unit: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  unit_price: string;

  @Column({ type: "decimal", precision: 5, scale: 4 })
  tax_rate: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  line_total: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => Product, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "product_id" })
  product: Product | null;
}
```

### 3.13 Delivery

```typescript
// src/entities/delivery.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Order } from "./order.entity";

/** @owner Logistics Service */
@Entity("deliveries")
@Index(["order_id"], { unique: true })
@Index(["status"])
export class Delivery {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", unique: true })
  order_id: string;

  @Column({ type: "varchar", length: 20, default: "scheduled" })
  status: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  carrier: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  tracking_code: string | null;

  @Column({ type: "timestamptz", nullable: true })
  estimated_delivery_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  actual_delivery_at: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  proof_of_delivery_url: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @OneToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order: Order;
}
```

### 3.14 Invoice

```typescript
// src/entities/invoice.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Provider } from "./provider.entity";
import { Business } from "./business.entity";
import { InvoiceLine } from "./invoice-line.entity";
import { Payment } from "./payment.entity";

/** @owner Payment Service */
@Entity("invoices")
@Index(["provider_id", "status"])
@Index(["business_id", "status"])
@Index(["invoice_number"], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  invoice_number: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  tax_total: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total: string;

  @Column({ type: "varchar", length: 3 })
  currency: string;

  @Column({ type: "date" })
  due_date: Date;

  @Column({ type: "timestamptz", nullable: true })
  issued_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  paid_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Provider, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;

  @ManyToOne(() => Business, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @OneToMany(() => InvoiceLine, (il) => il.invoice)
  invoiceLines: InvoiceLine[];

  @OneToMany(() => Payment, (p) => p.invoice)
  payments: Payment[];
}
```

### 3.15 InvoiceLine

```typescript
// src/entities/invoice-line.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Invoice } from "./invoice.entity";
import { Order } from "./order.entity";

/** @owner Payment Service */
@Entity("invoice_lines")
@Index(["invoice_id"])
export class InvoiceLine {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  invoice_id: string;

  @Column({ type: "uuid", nullable: true })
  order_id: string | null;

  @Column({ type: "varchar", length: 255 })
  description: string;

  @Column({ type: "decimal", precision: 12, scale: 3 })
  quantity: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  unit_price: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  line_total: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Invoice, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoice_id" })
  invoice: Invoice;

  @ManyToOne(() => Order, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "order_id" })
  order: Order | null;
}
```

### 3.16 Payment

```typescript
// src/entities/payment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Invoice } from "./invoice.entity";
import { Business } from "./business.entity";

/** @owner Payment Service */
@Entity("payments")
@Index(["invoice_id"])
@Index(["business_id"])
@Index(["status"])
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  invoice_id: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: string;

  @Column({ type: "varchar", length: 3 })
  currency: string;

  @Column({ type: "varchar", length: 20 })
  status: string;

  @Column({ type: "varchar", length: 30 })
  method: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  external_id: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: "timestamptz", nullable: true })
  paid_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Invoice, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "invoice_id" })
  invoice: Invoice;

  @ManyToOne(() => Business, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "business_id" })
  business: Business;
}
```

### 3.17 Rating

```typescript
// src/entities/rating.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Order } from "./order.entity";
import { Business } from "./business.entity";
import { Provider } from "./provider.entity";

/** @owner Trust Service */
@Entity("ratings")
@Index(["order_id"], { unique: true })
@Index(["provider_id"])
export class Rating {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", unique: true })
  order_id: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "smallint" })
  rating: number;

  @Column({ type: "jsonb", nullable: true })
  dimensions: Record<string, unknown> | null;

  @Column({ type: "text", nullable: true })
  comment: string | null;

  @Column({ type: "boolean", default: true })
  is_visible: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => Business, { onDelete: "CASCADE" })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;
}
```

---

## 4. Index on User (email, status)

Add to `user.entity.ts` if not using raw migration for indexes:

```typescript
// In user.entity.ts add:
import { Index } from "typeorm";

@Entity("users")
@Index(["email"]) // unique already creates index; explicit if needed
@Index(["status"])
export class User {
  // ...
}
```

Doc 13 already has `CREATE INDEX idx_users_email` and `idx_users_status`; the `unique: true` on email implies a unique index. The entities above omit duplicate indexes; the migration in the next section creates all indexes.

---

## 5. Initial migration (TypeORM)

Migration order follows doc 13: users → businesses → providers → business_users, provider_users, sessions → locations → ALTER businesses (default_delivery_address_id) → preferred_suppliers → products, availability → orders → order_lines → deliveries → invoices → invoice_lines → payments → ratings.

### 5.1 TypeORM migration class (runnable with TypeORM CLI)

Create a DataSource used only for migrations (e.g. `src/config/typeorm-data-source.ts`) and point `migrations` to `src/migrations/*.ts`. Then run: `npx typeorm migration:run -d src/config/typeorm-data-source.ts`.

The migration below uses `queryRunner.query()` with the full SQL from doc 13 so that CHECK constraints and index names match exactly.

```typescript
// src/migrations/1738500000001-InitialMvpSchema.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMvpSchema1738500000001 implements MigrationInterface {
  name = "InitialMvpSchema1738500000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL UNIQUE,
        "phone" varchar(50),
        "password_hash" varchar(255) NOT NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "avatar_url" varchar(500),
        "email_verified_at" timestamptz,
        "phone_verified_at" timestamptz,
        "status" varchar(20) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'active', 'suspended', 'deleted')),
        "locale" varchar(10) DEFAULT 'en_GB',
        "timezone" varchar(50) DEFAULT 'UTC',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_users_email" ON "users" ("email")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_status" ON "users" ("status")`
    );

    // 2. businesses (no FK to locations yet)
    await queryRunner.query(`
      CREATE TABLE "businesses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "legal_name" varchar(255) NOT NULL,
        "trading_name" varchar(255) NOT NULL,
        "registration_number" varchar(50),
        "tax_id" varchar(50),
        "business_type" varchar(30) NOT NULL CHECK ("business_type" IN ('restaurant', 'cafe', 'bar', 'hotel', 'catering', 'other')),
        "status" varchar(30) NOT NULL DEFAULT 'pending_verification' CHECK ("status" IN ('pending_verification', 'active', 'suspended', 'closed')),
        "logo_url" varchar(500),
        "default_currency" varchar(3) NOT NULL DEFAULT 'GBP',
        "default_delivery_address_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_businesses_status" ON "businesses" ("status")`
    );

    // 3. providers
    await queryRunner.query(`
      CREATE TABLE "providers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "legal_name" varchar(255) NOT NULL,
        "trading_name" varchar(255) NOT NULL,
        "registration_number" varchar(50),
        "tax_id" varchar(50),
        "provider_type" varchar(50) NOT NULL CHECK ("provider_type" IN ('food_wholesaler', 'beverage_distributor', 'coffee_roaster', 'bakery', 'meat_fish', 'cleaning', 'equipment', 'logistics', 'producer', 'other')),
        "status" varchar(30) NOT NULL DEFAULT 'pending_verification' CHECK ("status" IN ('pending_verification', 'active', 'suspended', 'closed')),
        "logo_url" varchar(500),
        "description" text,
        "default_currency" varchar(3) NOT NULL DEFAULT 'GBP',
        "min_order_value" numeric(12,2),
        "lead_time_hours" int,
        "service_radius_km" numeric(8,2),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_providers_status" ON "providers" ("status")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_providers_provider_type" ON "providers" ("provider_type")`
    );

    // 4. business_users, provider_users, sessions
    await queryRunner.query(`
      CREATE TABLE "business_users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "business_id" uuid NOT NULL REFERENCES "businesses" ("id") ON DELETE CASCADE,
        "role" varchar(30) NOT NULL CHECK ("role" IN ('business_owner', 'business_manager', 'business_staff')),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("user_id", "business_id")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_business_users_business_id" ON "business_users" ("business_id")`
    );

    await queryRunner.query(`
      CREATE TABLE "provider_users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "provider_id" uuid NOT NULL REFERENCES "providers" ("id") ON DELETE CASCADE,
        "role" varchar(30) NOT NULL CHECK ("role" IN ('provider_owner', 'provider_manager', 'provider_staff')),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("user_id", "provider_id")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_provider_users_provider_id" ON "provider_users" ("provider_id")`
    );

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "token_hash" varchar(255) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_token_hash" ON "sessions" ("token_hash")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_expires_at" ON "sessions" ("expires_at")`
    );

    // 5. locations
    await queryRunner.query(`
      CREATE TABLE "locations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "address_line_1" varchar(255) NOT NULL,
        "address_line_2" varchar(100),
        "city" varchar(100) NOT NULL,
        "region" varchar(100),
        "postal_code" varchar(20) NOT NULL,
        "country" varchar(2) NOT NULL,
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "location_type" varchar(30) NOT NULL CHECK ("location_type" IN ('business_premises', 'warehouse', 'delivery_address')),
        "owner_type" varchar(20) NOT NULL CHECK ("owner_type" IN ('business', 'provider')),
        "owner_id" uuid NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "contact_name" varchar(100),
        "contact_phone" varchar(50),
        "delivery_instructions" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_locations_owner" ON "locations" ("owner_type", "owner_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_locations_postal_code" ON "locations" ("postal_code")`
    );

    await queryRunner.query(`
      ALTER TABLE "businesses"
        ADD CONSTRAINT "fk_businesses_default_delivery"
        FOREIGN KEY ("default_delivery_address_id") REFERENCES "locations" ("id") ON DELETE SET NULL
    `);

    // 6. preferred_suppliers, products, availability
    await queryRunner.query(`
      CREATE TABLE "preferred_suppliers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL REFERENCES "businesses" ("id") ON DELETE CASCADE,
        "provider_id" uuid NOT NULL REFERENCES "providers" ("id") ON DELETE CASCADE,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("business_id", "provider_id")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_preferred_suppliers_provider_id" ON "preferred_suppliers" ("provider_id")`
    );

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider_id" uuid NOT NULL REFERENCES "providers" ("id") ON DELETE CASCADE,
        "sku" varchar(100) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "category" varchar(50) NOT NULL,
        "unit" varchar(20) NOT NULL,
        "unit_size" varchar(50),
        "price" numeric(12,2) NOT NULL,
        "currency" varchar(3) NOT NULL,
        "tax_rate" numeric(5,4) NOT NULL,
        "min_order_quantity" numeric(12,3),
        "max_order_quantity" numeric(12,3),
        "is_active" boolean NOT NULL DEFAULT true,
        "image_urls" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("provider_id", "sku")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_products_provider_active" ON "products" ("provider_id", "is_active")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_category" ON "products" ("category")`
    );

    await queryRunner.query(`
      CREATE TABLE "availability" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider_id" uuid NOT NULL REFERENCES "providers" ("id") ON DELETE CASCADE,
        "availability_type" varchar(30) NOT NULL CHECK ("availability_type" IN ('delivery_window', 'collection', 'service_area')),
        "day_of_week" int CHECK ("day_of_week" IS NULL OR ("day_of_week" >= 0 AND "day_of_week" <= 6)),
        "start_time" time,
        "end_time" time,
        "valid_from" date,
        "valid_until" date,
        "region_postcodes" jsonb,
        "radius_km" numeric(8,2),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_availability_provider_id" ON "availability" ("provider_id")`
    );

    // 7. orders, order_lines
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_number" varchar(50) NOT NULL UNIQUE,
        "business_id" uuid NOT NULL REFERENCES "businesses" ("id") ON DELETE RESTRICT,
        "provider_id" uuid NOT NULL REFERENCES "providers" ("id") ON DELETE RESTRICT,
        "delivery_location_id" uuid NOT NULL REFERENCES "locations" ("id") ON DELETE RESTRICT,
        "status" varchar(20) NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'submitted', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
        "subtotal" numeric(12,2) NOT NULL,
        "tax_total" numeric(12,2) NOT NULL,
        "delivery_fee" numeric(12,2),
        "total" numeric(12,2) NOT NULL,
        "currency" varchar(3) NOT NULL,
        "requested_delivery_date" date NOT NULL,
        "requested_delivery_slot_start" time,
        "requested_delivery_slot_end" time,
        "notes" text,
        "internal_notes" text,
        "submitted_at" timestamptz,
        "confirmed_at" timestamptz,
        "delivered_at" timestamptz,
        "cancellation_reason" varchar(255),
        "cancelled_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_orders_business_status_created" ON "orders" ("business_id", "status", "created_at" DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_provider_status" ON "orders" ("provider_id", "status")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_orders_order_number" ON "orders" ("order_number")`
    );

    await queryRunner.query(`
      CREATE TABLE "order_lines" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE,
        "line_type" varchar(20) NOT NULL CHECK ("line_type" IN ('product', 'service')),
        "product_id" uuid REFERENCES "products" ("id") ON DELETE SET NULL,
        "name" varchar(255) NOT NULL,
        "quantity" numeric(12,3) NOT NULL,
        "unit" varchar(20) NOT NULL,
        "unit_price" numeric(12,2) NOT NULL,
        "tax_rate" numeric(5,4) NOT NULL,
        "line_total" numeric(12,2) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_order_lines_order_id" ON "order_lines" ("order_id")`
    );

    // 8. deliveries
    await queryRunner.query(`
      CREATE TABLE "deliveries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL UNIQUE REFERENCES "orders" ("id") ON DELETE CASCADE,
        "status" varchar(20) NOT NULL DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'picked_up', 'in_transit', 'delivered', 'failed')),
        "carrier" varchar(100),
        "tracking_code" varchar(100),
        "estimated_delivery_at" timestamptz,
        "actual_delivery_at" timestamptz,
        "proof_of_delivery_url" varchar(500),
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_deliveries_order_id" ON "deliveries" ("order_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_deliveries_status" ON "deliveries" ("status")`
    );

    // 9. invoices, invoice_lines, payments
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_number" varchar(50) NOT NULL UNIQUE,
        "provider_id" uuid NOT NULL REFERENCES "providers" ("id") ON DELETE RESTRICT,
        "business_id" uuid NOT NULL REFERENCES "businesses" ("id") ON DELETE RESTRICT,
        "status" varchar(20) NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'issued', 'paid', 'overdue', 'cancelled')),
        "subtotal" numeric(12,2) NOT NULL,
        "tax_total" numeric(12,2) NOT NULL,
        "total" numeric(12,2) NOT NULL,
        "currency" varchar(3) NOT NULL,
        "due_date" date NOT NULL,
        "issued_at" timestamptz,
        "paid_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_provider_status" ON "invoices" ("provider_id", "status")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_business_status" ON "invoices" ("business_id", "status")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_invoices_invoice_number" ON "invoices" ("invoice_number")`
    );

    await queryRunner.query(`
      CREATE TABLE "invoice_lines" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_id" uuid NOT NULL REFERENCES "invoices" ("id") ON DELETE CASCADE,
        "order_id" uuid REFERENCES "orders" ("id") ON DELETE SET NULL,
        "description" varchar(255) NOT NULL,
        "quantity" numeric(12,3) NOT NULL,
        "unit_price" numeric(12,2) NOT NULL,
        "line_total" numeric(12,2) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_invoice_lines_invoice_id" ON "invoice_lines" ("invoice_id")`
    );

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_id" uuid NOT NULL REFERENCES "invoices" ("id") ON DELETE RESTRICT,
        "business_id" uuid NOT NULL REFERENCES "businesses" ("id") ON DELETE RESTRICT,
        "amount" numeric(12,2) NOT NULL,
        "currency" varchar(3) NOT NULL,
        "status" varchar(20) NOT NULL CHECK ("status" IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
        "method" varchar(30) NOT NULL CHECK ("method" IN ('card', 'bank_transfer', 'platform_balance', 'other')),
        "external_id" varchar(255),
        "metadata" jsonb,
        "paid_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_payments_invoice_id" ON "payments" ("invoice_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_business_id" ON "payments" ("business_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_status" ON "payments" ("status")`
    );

    // 10. ratings
    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL UNIQUE REFERENCES "orders" ("id") ON DELETE CASCADE,
        "business_id" uuid NOT NULL REFERENCES "businesses" ("id") ON DELETE CASCADE,
        "provider_id" uuid NOT NULL REFERENCES "providers" ("id") ON DELETE CASCADE,
        "rating" smallint NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
        "dimensions" jsonb,
        "comment" text,
        "is_visible" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_ratings_order_id" ON "ratings" ("order_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ratings_provider_id" ON "ratings" ("provider_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse FK order
    await queryRunner.query(`DROP TABLE IF EXISTS "ratings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "deliveries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "availability"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "preferred_suppliers"`);
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP CONSTRAINT IF EXISTS "fk_businesses_default_delivery"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "locations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "provider_users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "business_users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "providers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "businesses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
```

### 5.2 TypeORM DataSource for migrations

```typescript
// src/config/typeorm-data-source.ts
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  migrations: ["src/migrations/*.ts"],
  entities: ["src/entities/*.entity.ts"],
  synchronize: false,
});
```

Add to `package.json` scripts:

```json
"migrate": "typeorm-ts-node-commonjs -d src/config/typeorm-data-source.ts migration:run",
"migrate:revert": "typeorm-ts-node-commonjs -d src/config/typeorm-data-source.ts migration:revert"
```

(Use `ts-node` with `-r tsconfig-paths/register` if paths are needed; adjust `typeorm-ts-node-commonjs` to match your TypeORM/Node setup.)

---

## 6. Seed scripts

### 6.1 Idempotent SQL seed (run after migrations)

Full script from `docs/15-MVP-CI-CD-SEED.md` section 2.6. Place at `src/seeds/seed-mvp.sql` (or `scripts/seed-mvp.sql`). Run with: `psql $DATABASE_URL -f src/seeds/seed-mvp.sql` or `npm run seed`.

Minimal placeholder reference (same content as doc 15; use the full SQL from there):

- **Users:** 3 (buyer@mvp.local, provider@mvp.local, admin@mvp.local) with fixed UUIDs; `ON CONFLICT (email) DO UPDATE`.
- **Businesses:** 1 (MVP Test Restaurant); `ON CONFLICT (id) DO NOTHING`.
- **Providers:** 1 (MVP Test Wholesaler); `ON CONFLICT (id) DO NOTHING`.
- **business_users / provider_users:** 1 each; `ON CONFLICT (user_id, business_id)` / `(user_id, provider_id) DO NOTHING`.
- **locations:** 1 delivery address; then `UPDATE businesses SET default_delivery_address_id`.
- **products:** 3 (SKU001–003); `ON CONFLICT (provider_id, sku) DO NOTHING`.
- **orders:** 1 (status `delivered`); **order_lines:** 2; **deliveries:** 1; **invoices:** 1; **invoice_lines:** 2; **payments:** 1; **ratings:** 1 — all with fixed UUIDs and `ON CONFLICT (id) DO NOTHING`.

### 6.2 Optional: NestJS seed service (TypeORM)

For programmatic seed (e.g. in tests or CI), use a minimal NestJS module that runs the same data via repositories.

```typescript
// src/seeds/seed.service.ts (minimal placeholder)
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class SeedService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async run(): Promise<void> {
    // Option A: Run raw SQL file
    // const sql = readFileSync(join(__dirname, 'seed-mvp.sql'), 'utf-8');
    // await this.dataSource.query(sql);

    // Option B: Idempotent inserts via repositories (User, Business, etc.)
    // Use fixed UUIDs and .upsert() or INSERT ... ON CONFLICT in raw query.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Insert users, businesses, providers, ... in dependency order
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }
}
```

```typescript
// src/seeds/seed.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeedService } from "./seed.service";

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
```

### 6.3 Run seed (CLI)

```bash
# After migrations
npm run migrate
psql $DATABASE_URL -f src/seeds/seed-mvp.sql
# or: npm run seed  → if you add "seed": "psql $DATABASE_URL -f src/seeds/seed-mvp.sql" to package.json
```

---

## 7. Wiring entities in app

Ensure TypeORM loads entities. In `src/config/database.config.ts` (or equivalent):

```typescript
// Already have autoLoadEntities: true; register entities in each feature module
// OR list entities explicitly in TypeOrmModule.forRootAsync:
entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
```

If using `autoLoadEntities: true`, each module that uses an entity must import `TypeOrmModule.forFeature([...])`. For a single DB and all entities in one place you can also do:

```typescript
import * as path from 'path';
// In typeOrmModuleOptions useFactory:
entities: [path.join(__dirname, '..', 'entities', '**', '*.entity{.ts,.js}')],
```

---

## 8. Summary

| Deliverable       | Location / content                                                                  |
| ----------------- | ----------------------------------------------------------------------------------- |
| 17 entities       | `src/entities/*.entity.ts` — match doc 13 column names and relations                |
| Ownership         | Comment per entity: Identity, Business, Provider, Order, Logistics, Payment, Trust  |
| Initial migration | `src/migrations/1738500000001-InitialMvpSchema.ts` — full schema + indexes + CHECKs |
| Seed SQL          | Idempotent; fixed UUIDs; from doc 15 → `src/seeds/seed-mvp.sql`                     |
| Seed runner       | `psql -f` or optional `SeedService` in `src/seeds/`                                 |
| Run order         | 1) migrate 2) seed                                                                  |

No **Service** entity in MVP; only **Product** and **Availability** (doc 13). Add Service in a later phase if the schema is extended.
