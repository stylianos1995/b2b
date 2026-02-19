import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMvpSchema1738500000001 implements MigrationInterface {
  name = "InitialMvpSchema1738500000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      `CREATE INDEX "idx_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_status" ON "users" ("status")`,
    );

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
      `CREATE INDEX "idx_businesses_status" ON "businesses" ("status")`,
    );

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
      `CREATE INDEX "idx_providers_status" ON "providers" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_providers_provider_type" ON "providers" ("provider_type")`,
    );

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
      `CREATE INDEX "idx_business_users_business_id" ON "business_users" ("business_id")`,
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
      `CREATE INDEX "idx_provider_users_provider_id" ON "provider_users" ("provider_id")`,
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
      `CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_token_hash" ON "sessions" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_expires_at" ON "sessions" ("expires_at")`,
    );

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
      `CREATE INDEX "idx_locations_owner" ON "locations" ("owner_type", "owner_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_locations_postal_code" ON "locations" ("postal_code")`,
    );

    await queryRunner.query(`
      ALTER TABLE "businesses"
        ADD CONSTRAINT "fk_businesses_default_delivery"
        FOREIGN KEY ("default_delivery_address_id") REFERENCES "locations" ("id") ON DELETE SET NULL
    `);

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
      `CREATE INDEX "idx_preferred_suppliers_provider_id" ON "preferred_suppliers" ("provider_id")`,
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
      `CREATE INDEX "idx_products_provider_active" ON "products" ("provider_id", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_category" ON "products" ("category")`,
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
      `CREATE INDEX "idx_availability_provider_id" ON "availability" ("provider_id")`,
    );

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
      `CREATE INDEX "idx_orders_business_status_created" ON "orders" ("business_id", "status", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_provider_status" ON "orders" ("provider_id", "status")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_orders_order_number" ON "orders" ("order_number")`,
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
      `CREATE INDEX "idx_order_lines_order_id" ON "order_lines" ("order_id")`,
    );

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
      `CREATE UNIQUE INDEX "idx_deliveries_order_id" ON "deliveries" ("order_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_deliveries_status" ON "deliveries" ("status")`,
    );

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
      `CREATE INDEX "idx_invoices_provider_status" ON "invoices" ("provider_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invoices_business_status" ON "invoices" ("business_id", "status")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_invoices_invoice_number" ON "invoices" ("invoice_number")`,
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
      `CREATE INDEX "idx_invoice_lines_invoice_id" ON "invoice_lines" ("invoice_id")`,
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
      `CREATE INDEX "idx_payments_invoice_id" ON "payments" ("invoice_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_business_id" ON "payments" ("business_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_status" ON "payments" ("status")`,
    );

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
      `CREATE UNIQUE INDEX "idx_ratings_order_id" ON "ratings" ("order_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ratings_provider_id" ON "ratings" ("provider_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `ALTER TABLE "businesses" DROP CONSTRAINT IF EXISTS "fk_businesses_default_delivery"`,
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
