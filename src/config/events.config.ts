/**
 * Event bus configuration.
 * MVP: use in-memory (EventEmitter2); later swap for AMQP or Redis.
 */
export const EVENT_BUS_URL = process.env.EVENT_BUS_URL ?? "";
