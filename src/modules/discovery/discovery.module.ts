import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Provider } from "../../entities/provider.entity";
import { Product } from "../../entities/product.entity";
import { DiscoveryController } from "./discovery.controller";
import { DiscoveryService } from "./discovery.service";

@Module({
  imports: [TypeOrmModule.forFeature([Provider, Product])],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
