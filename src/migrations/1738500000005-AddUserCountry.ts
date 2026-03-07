import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserCountry1738500000005 implements MigrationInterface {
  name = "AddUserCountry1738500000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "country" varchar(2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "country"`);
  }
}
