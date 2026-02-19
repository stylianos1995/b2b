import { Module } from "@nestjs/common";
import { AuthEventsProducer } from "./auth-events.producer";
import { BusinessEventsProducer } from "./business-events.producer";
import { ProviderEventsProducer } from "./provider-events.producer";
import { OrderEventsProducer } from "./order-events.producer";
import { DeliveryEventsProducer } from "./delivery-events.producer";
import { PaymentEventsProducer } from "./payment-events.producer";
import { TrustEventsProducer } from "./trust-events.producer";

@Module({
  providers: [
    AuthEventsProducer,
    BusinessEventsProducer,
    ProviderEventsProducer,
    OrderEventsProducer,
    DeliveryEventsProducer,
    PaymentEventsProducer,
    TrustEventsProducer,
  ],
  exports: [
    AuthEventsProducer,
    BusinessEventsProducer,
    ProviderEventsProducer,
    OrderEventsProducer,
    DeliveryEventsProducer,
    PaymentEventsProducer,
    TrustEventsProducer,
  ],
})
export class ProducersModule {}
