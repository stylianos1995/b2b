import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Allow payment method 'stripe' for payments created via Stripe Checkout webhook.
 */
export class AddStripePaymentMethod1738500000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_method_check"`,
    );
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "payments_method_check"
      CHECK ("method" IN ('card', 'bank_transfer', 'platform_balance', 'other', 'stripe'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_method_check"`,
    );
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "payments_method_check"
      CHECK ("method" IN ('card', 'bank_transfer', 'platform_balance', 'other'))
    `);
  }
}
