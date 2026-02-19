import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Invoice } from "../../entities/invoice.entity";
import { Payment } from "../../entities/payment.entity";
import { StripeService } from "./stripe.service";
import { StripeController } from "./stripe.controller";
import { ProducersModule } from "../../producers/producers.module";

/**
 * Stripe Checkout and webhook. Imported by PaymentModule so all payment-related
 * routes (invoices, payments, stripe checkout/webhook) live under the same module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payment]), ProducersModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
