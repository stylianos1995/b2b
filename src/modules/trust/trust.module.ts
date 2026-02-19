import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Rating } from "../../entities/rating.entity";
import { Order } from "../../entities/order.entity";
import { RatingService } from "./rating.service";
import { RatingController } from "./rating.controller";
import { ProducersModule } from "../../producers/producers.module";

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Order]), ProducersModule],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class TrustModule {}
