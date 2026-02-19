import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Runs the idempotent MVP seed SQL script.
 * Executes one statement at a time in a transaction so we get a clear error if one fails.
 */
@Injectable()
export class SeedService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async run(): Promise<void> {
    const possiblePaths = [
      join(__dirname, "seed-mvp.sql"),
      join(process.cwd(), "src", "seeds", "seed-mvp.sql"),
    ];
    const sqlPath = possiblePaths.find((p) => existsSync(p));
    if (!sqlPath) {
      throw new Error(
        `Seed file not found. Tried: ${possiblePaths.join(", ")}`,
      );
    }
    const sql = readFileSync(sqlPath, "utf-8");
    const statements = sql
      .replace(/\r\n/g, "\n")
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s !== "BEGIN" && s !== "COMMIT");
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (!stmt) continue;
        try {
          await queryRunner.query(stmt + ";");
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const preview = stmt.replace(/\s+/g, " ").slice(0, 60);
          throw new Error(
            `Seed failed at statement ${i + 1} (${preview}...): ${msg}`,
          );
        }
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
