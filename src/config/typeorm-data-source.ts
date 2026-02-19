import { DataSource } from "typeorm";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  migrations: ["src/migrations/*.ts"],
  entities: ["src/entities/*.entity.ts"],
  synchronize: false,
});
