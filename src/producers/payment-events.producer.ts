import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { EventBusService } from "../events/event-bus.service";
import { EVENT_NAMES } from "../events/event-names";
import {
  InvoiceGeneratedPayload,
  PaymentInitiatedPayload,
  PaymentCompletedPayload,
  PayoutExecutedPayload,
} from "../events/event.types";

@Injectable()
export class PaymentEventsProducer {
  constructor(private readonly eventBus: EventBusService) {}

  invoiceGenerated(params: {
    invoice_id: string;
    provider_id: string;
    business_id: string;
    order_ids: string[];
  }): void {
    const payload: InvoiceGeneratedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.INVOICE_GENERATED,
      schema_version: "1.0",
      producer_service: "payment",
      occurred_at: new Date().toISOString(),
      invoice_id: params.invoice_id,
      provider_id: params.provider_id,
      business_id: params.business_id,
      order_ids: params.order_ids,
      issued_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.INVOICE_GENERATED, payload);
  }

  paymentInitiated(params: {
    payment_id: string;
    payable_type: string;
    payable_id: string;
    amount: string;
    currency: string;
  }): void {
    const payload: PaymentInitiatedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PAYMENT_INITIATED,
      schema_version: "1.0",
      producer_service: "payment",
      occurred_at: new Date().toISOString(),
      payment_id: params.payment_id,
      payable_type: params.payable_type,
      payable_id: params.payable_id,
      amount: params.amount,
      currency: params.currency,
      initiated_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PAYMENT_INITIATED, payload);
  }

  paymentCompleted(params: {
    payment_id: string;
    payable_type: string;
    payable_id: string;
    amount: string;
  }): void {
    const payload: PaymentCompletedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PAYMENT_COMPLETED,
      schema_version: "1.0",
      producer_service: "payment",
      occurred_at: new Date().toISOString(),
      payment_id: params.payment_id,
      payable_type: params.payable_type,
      payable_id: params.payable_id,
      amount: params.amount,
      paid_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PAYMENT_COMPLETED, payload);
  }

  payoutExecuted(params: {
    payout_id: string;
    provider_id: string;
    amount: string;
    currency: string;
  }): void {
    const payload: PayoutExecutedPayload = {
      event_id: uuidv4(),
      event_type: EVENT_NAMES.PAYOUT_EXECUTED,
      schema_version: "1.0",
      producer_service: "payment",
      occurred_at: new Date().toISOString(),
      payout_id: params.payout_id,
      provider_id: params.provider_id,
      amount: params.amount,
      currency: params.currency,
      executed_at: new Date().toISOString(),
    };
    this.eventBus.emit(EVENT_NAMES.PAYOUT_EXECUTED, payload);
  }
}
