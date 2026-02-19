import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Delivery } from "../../entities/delivery.entity";
import { Order } from "../../entities/order.entity";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";
import { ProducersModule } from "../../producers/producers.module";

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, Order]), ProducersModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
