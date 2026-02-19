import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../../entities/invoice.entity';
import { InvoiceLine } from '../../entities/invoice-line.entity';
import { Order } from '../../entities/order.entity';
import { Payment } from '../../entities/payment.entity';
import { Business } from '../../entities/business.entity';
import { Provider } from '../../entities/provider.entity';
import { InvoiceService } from './invoice.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { PaymentService } from './payment.service';
import { InvoiceController } from './invoice.controller';
import { BuyerInvoicesController } from './buyer-invoices.controller';
import { ProviderInvoicesController } from './provider-invoices.controller';
import { PaymentController } from './payment.controller';
import { StripeModule } from './stripe.module';
import { ProducersModule } from '../../producers/producers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceLine, Order, Payment, Business, Provider]),
    ProducersModule,
    StripeModule,
  ],
  controllers: [
    InvoiceController,
    BuyerInvoicesController,
    ProviderInvoicesController,
    PaymentController,
  ],
  providers: [InvoiceService, InvoicePdfService, PaymentService],
  exports: [InvoiceService, PaymentService],
})
export class PaymentModule {}
