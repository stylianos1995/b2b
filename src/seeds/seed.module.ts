import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeedService } from "./seed.service";
import {
  User,
  BusinessUser,
  ProviderUser,
  Session,
  Business,
  Location,
  PreferredSupplier,
  Provider,
  Product,
  Availability,
  Order,
  OrderLine,
  Delivery,
  Invoice,
  InvoiceLine,
  Payment,
  Rating,
} from "../entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      BusinessUser,
      ProviderUser,
      Session,
      Business,
      Location,
      PreferredSupplier,
      Provider,
      Product,
      Availability,
      Order,
      OrderLine,
      Delivery,
      Invoice,
      InvoiceLine,
      Payment,
      Rating,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
