import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD } from "@nestjs/core";
import { configModuleOptions } from "./config/app.config";
import { typeOrmModuleOptions } from "./config/database.config";
import { EventBusModule } from "./events/event-bus.module";
import { ProducersModule } from "./producers/producers.module";
import { ConsumersModule } from "./consumers/consumers.module";
import { CommonModule } from "./common/common.module";
import { IdempotencyModule } from "./common/idempotency/idempotency.module";
import { SeedModule } from "./seeds/seed.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { BusinessModule } from "./modules/business/business.module";
import { ProviderModule } from "./modules/provider/provider.module";
import { DiscoveryModule } from "./modules/discovery/discovery.module";
import { OrderModule } from "./modules/order/order.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { TrustModule } from "./modules/trust/trust.module";
import { AdminModule } from "./modules/admin/admin.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    EventBusModule,
    ProducersModule,
    ConsumersModule,
    IdempotencyModule,
    CommonModule,
    AuthModule,
    HealthModule,
    BusinessModule,
    ProviderModule,
    DiscoveryModule,
    OrderModule,
    DeliveryModule,
    PaymentModule,
    TrustModule,
    AdminModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
