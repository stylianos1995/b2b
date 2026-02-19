import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds Stripe-related columns for Checkout and webhook idempotency:
 * - invoices.stripe_session_id: set when creating Checkout session; webhook uses it to find the invoice.
 * - payments.stripe_payment_intent_id: stored when completing payment via Stripe (for reconciliation).
 */
export class AddStripeFields1738500000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD COLUMN IF NOT EXISTS "stripe_session_id" varchar(255) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" varchar(255) NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invoices_stripe_session_id"
      ON "invoices" ("stripe_session_id")
      WHERE "stripe_session_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_stripe_session_id"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN IF EXISTS "stripe_session_id"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN IF EXISTS "stripe_payment_intent_id"`);
  }
}
