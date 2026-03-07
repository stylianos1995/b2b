import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetFields1738500000006 implements MigrationInterface {
  name = "AddPasswordResetFields1738500000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "password_reset_token_hash" varchar(255),
      ADD COLUMN "password_reset_expires_at" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "password_reset_token_hash",
      DROP COLUMN "password_reset_expires_at"
    `);
  }
}
