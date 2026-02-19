import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventBusService } from '../events/event-bus.service';
import { EVENT_NAMES } from '../events/event-names';
import { ProviderVerifiedPayload, ProductCreatedPayload } from '../events/event.types';

@Injectable()
export class ProviderEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  providerVerified(params: { provider_id: string }): void {
    const payload: ProviderVerifiedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PROVIDER_VERIFIED,
      schema_version: '1.0',
      producer_service: 'provider',
      occurred_at: new Date().toISOString(),
      provider_id: params.provider_id,
      verified_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PROVIDER_VERIFIED, payload);
  }

  productCreated(params: { product_id: string; provider_id: string }): void {
    const payload: ProductCreatedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PRODUCT_CREATED,
      schema_version: '1.0',
      producer_service: 'provider',
      occurred_at: new Date().toISOString(),
      product_id: params.product_id,
      provider_id: params.provider_id,
      created_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PRODUCT_CREATED, payload);
  }
}
