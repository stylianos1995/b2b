import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EVENT_NAMES } from "../events/event-names";
import { NotificationService } from "../notifications/notification.service";

@Injectable()
export class NotificationConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(EVENT_NAMES.USER_REGISTERED)
  async handleUserRegistered(payload: {
    email: string;
    user_id: string;
  }): Promise<void> {
    await this.notificationService.sendWelcomeEmail(payload.email, {
      userId: payload.user_id,
    });
  }

  @OnEvent(EVENT_NAMES.ORDER_PLACED)
  async handleOrderPlaced(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }): Promise<void> {
    await this.notificationService.sendOrderPlacedToProvider(payload);
  }

  @OnEvent(EVENT_NAMES.ORDER_CONFIRMED)
  async handleOrderConfirmed(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }): Promise<void> {
    await this.notificationService.sendOrderConfirmedToBuyer(payload);
  }

  @OnEvent(EVENT_NAMES.ORDER_DELIVERED)
  async handleOrderDelivered(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }): Promise<void> {
    await this.notificationService.sendOrderDeliveredToBuyer(payload);
  }

  @OnEvent(EVENT_NAMES.INVOICE_GENERATED)
  async handleInvoiceGenerated(payload: {
    invoice_id: string;
    provider_id: string;
    business_id: string;
    order_ids: string[];
  }): Promise<void> {
    await this.notificationService.sendInvoiceGenerated(payload);
  }

  @OnEvent(EVENT_NAMES.PAYMENT_COMPLETED)
  async handlePaymentCompleted(payload: {
    payment_id: string;
    payable_id: string;
    amount: string;
  }): Promise<void> {
    await this.notificationService.sendPaymentCompletedToProvider(payload);
  }

  @OnEvent(EVENT_NAMES.PROVIDER_VERIFIED)
  async handleProviderVerified(payload: {
    provider_id: string;
  }): Promise<void> {
    await this.notificationService.sendProviderVerified(payload);
  }
}
