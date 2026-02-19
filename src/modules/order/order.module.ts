import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "../../entities/order.entity";
import { OrderLine } from "../../entities/order-line.entity";
import { Delivery } from "../../entities/delivery.entity";
import { Location } from "../../entities/location.entity";
import { Product } from "../../entities/product.entity";
import { Provider } from "../../entities/provider.entity";
import { OrderService } from "./order.service";
import { BuyerOrdersController } from "./buyer-orders.controller";
import { ProviderOrdersController } from "./provider-orders.controller";
import { ProducersModule } from "../../producers/producers.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderLine,
      Delivery,
      Location,
      Product,
      Provider,
    ]),
    ProducersModule,
  ],
  controllers: [BuyerOrdersController, ProviderOrdersController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
