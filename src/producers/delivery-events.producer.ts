import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventBusService } from '../events/event-bus.service';
import { EVENT_NAMES } from '../events/event-names';
import { OrderDeliveredPayload } from '../events/event.types';

@Injectable()
export class DeliveryEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  orderDelivered(params: {
    order_id: string;
    delivery_id: string;
    business_id: string;
    provider_id: string;
  }): void {
    const payload: OrderDeliveredPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_DELIVERED,
      schema_version: '1.0',
      producer_service: 'logistics',
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      delivery_id: params.delivery_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      delivered_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_DELIVERED, payload);
  }
}
