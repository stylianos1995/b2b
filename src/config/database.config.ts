import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const typeOrmModuleOptions = {
  useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
    type: "postgres",
    url: config.get<string>("DATABASE_URL"),
    autoLoadEntities: true,
    synchronize: false,
    logging: config.get("NODE_ENV") === "development",
    extra: { connectionTimeoutMillis: 10000 },
    retryAttempts: 3,
    retryDelay: 3000,
  }),
  inject: [ConfigService],
};
