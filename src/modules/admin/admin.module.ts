import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../../entities/user.entity";
import { Business } from "../../entities/business.entity";
import { Provider } from "../../entities/provider.entity";
import { AdminService } from "./admin.service";
import { AdminUsersController } from "./admin-users.controller";
import { AdminBusinessesController } from "./admin-businesses.controller";
import { AdminProvidersController } from "./admin-providers.controller";
import { AdminPayoutsController } from "./admin-payouts.controller";
import { ProducersModule } from "../../producers/producers.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Business, Provider]),
    ProducersModule,
  ],
  controllers: [
    AdminUsersController,
    AdminBusinessesController,
    AdminProvidersController,
    AdminPayoutsController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
