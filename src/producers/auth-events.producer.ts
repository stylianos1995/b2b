import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventBusService } from '../events/event-bus.service';
import { EVENT_NAMES } from '../events/event-names';
import { UserRegisteredPayload } from '../events/event.types';

@Injectable()
export class AuthEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  userRegistered(params: { user_id: string; email: string }): void {
    const payload: UserRegisteredPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.USER_REGISTERED,
      schema_version: '1.0',
      producer_service: 'identity',
      occurred_at: new Date().toISOString(),
      user_id: params.user_id,
      email: params.email,
      registered_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.USER_REGISTERED, payload);
  }
}
