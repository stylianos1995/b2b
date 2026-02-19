import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventBusService } from '../events/event-bus.service';
import { EVENT_NAMES } from '../events/event-names';
import { RatingSubmittedPayload } from '../events/event.types';

@Injectable()
export class TrustEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  ratingSubmitted(params: {
    rating_id: string;
    order_id: string;
    business_id: string;
    provider_id: string;
    rating: number;
  }): void {
    const payload: RatingSubmittedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.RATING_SUBMITTED,
      schema_version: '1.0',
      producer_service: 'trust',
      occurred_at: new Date().toISOString(),
      rating_id: params.rating_id,
      order_id: params.order_id,
      business_id: params.business_id,
      provider_id: params.provider_id,
      rating: params.rating,
      submitted_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.RATING_SUBMITTED, payload);
  }
}
