import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventBusService } from '../events/event-bus.service';
import { EVENT_NAMES } from '../events/event-names';
import { BusinessCreatedPayload } from '../events/event.types';

@Injectable()
export class BusinessEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  businessCreated(params: { business_id: string; owner_user_id: string }): void {
    const payload: BusinessCreatedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.BUSINESS_CREATED,
      schema_version: '1.0',
      producer_service: 'business',
      occurred_at: new Date().toISOString(),
      business_id: params.business_id,
      owner_user_id: params.owner_user_id,
      created_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.BUSINESS_CREATED, payload);
  }
}
