import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventBusService } from '../events/event-bus.service';
import { EVENT_NAMES } from '../events/event-names';
import {
  OrderPlacedPayload,
  OrderConfirmedPayload,
  OrderPreparedPayload,
  OrderDispatchedPayload,
} from '../events/event.types';

@Injectable()
export class OrderEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  orderPlaced(params: { order_id: string; business_id: string; provider_id: string }): void {
    const payload: OrderPlacedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_PLACED,
      schema_version: '1.0',
      producer_service: 'order',
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      submitted_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_PLACED, payload);
  }

  orderConfirmed(params: { order_id: string; business_id: string; provider_id: string }): void {
    const payload: OrderConfirmedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_CONFIRMED,
      schema_version: '1.0',
      producer_service: 'order',
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      confirmed_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_CONFIRMED, payload);
  }

  orderPrepared(params: { order_id: string; provider_id: string }): void {
    const payload: OrderPreparedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_PREPARED,
      schema_version: '1.0',
      producer_service: 'order',
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      provider_id: params.provider_id,
      at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_PREPARED, payload);
  }

  orderDispatched(params: { order_id: string; business_id: string; provider_id: string }): void {
    const payload: OrderDispatchedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.ORDER_DISPATCHED,
      schema_version: '1.0',
      producer_service: 'order',
      occurred_at: new Date().toISOString(),
      order_id: params.order_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.ORDER_DISPATCHED, payload);
  }
}
