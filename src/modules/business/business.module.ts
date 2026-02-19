import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Business } from "../../entities/business.entity";
import { Location } from "../../entities/location.entity";
import { BusinessUser } from "../../entities/business-user.entity";
import { BusinessController } from "./business.controller";
import { BusinessService } from "./business.service";
import { ProducersModule } from "../../producers/producers.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Location, BusinessUser]),
    ProducersModule,
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
