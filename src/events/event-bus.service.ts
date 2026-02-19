import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService {
  constructor(private readonly emitter: EventEmitter2) {}

  /**
   * Emit event synchronously (listeners run in same tick).
   * Use after DB commit so consumers see persisted state.
   */
  emit<T extends object>(eventType: string, payload: T): void {
    this.emitter.emit(eventType, payload);
  }

  /**
   * Emit event asynchronously (listeners run in next tick).
   */
  emitAsync<T extends object>(eventType: string, payload: T): void {
    setImmediate(() => this.emitter.emit(eventType, payload));
  }
}
