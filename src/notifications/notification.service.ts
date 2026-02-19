import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private readonly from = { email: 'noreply@example.com', name: 'B2B Marketplace' };
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    this.enabled = !!this.config.get('SENDGRID_API_KEY');
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.enabled) {
      console.log('[Notification] (no SENDGRID_API_KEY) would send:', { to, subject });
      return;
    }
    // await sgMail.send({ to, from: this.from, subject, html });
  }

  async sendWelcomeEmail(email: string, ctx: { userId: string }): Promise<void> {
    const subject = 'Welcome to B2B Marketplace';
    const html = `<p>Hello,</p><p>Thanks for registering. Your account is ready.</p><p>User ID: ${ctx.userId}</p>`;
    await this.send(email, subject, html);
  }

  async sendOrderPlacedToProvider(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }): Promise<void> {
    const subject = `New order received: ${payload.order_id}`;
    const html = `<p>You have a new order.</p><p>Order ID: ${payload.order_id}</p><p>Business: ${payload.business_id}</p>`;
    await this.send('provider@example.com', subject, html);
  }

  async sendOrderConfirmedToBuyer(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }): Promise<void> {
    const subject = `Order confirmed: ${payload.order_id}`;
    const html = `<p>Your order has been confirmed.</p><p>Order ID: ${payload.order_id}</p>`;
    await this.send('buyer@example.com', subject, html);
  }

  async sendOrderDeliveredToBuyer(payload: {
    order_id: string;
    business_id: string;
    provider_id: string;
  }): Promise<void> {
    const subject = `Order delivered: ${payload.order_id}`;
    const html = `<p>Your order has been delivered.</p><p>Order ID: ${payload.order_id}</p>`;
    await this.send('buyer@example.com', subject, html);
  }

  async sendInvoiceGenerated(payload: {
    invoice_id: string;
    provider_id: string;
    business_id: string;
    order_ids: string[];
  }): Promise<void> {
    const subject = `Invoice issued: ${payload.invoice_id}`;
    const html = `<p>An invoice has been issued.</p><p>Invoice ID: ${payload.invoice_id}</p><p>Orders: ${payload.order_ids.join(', ')}</p>`;
    await this.send('buyer@example.com', subject, html);
  }

  async sendPaymentCompletedToProvider(payload: {
    payment_id: string;
    payable_id: string;
    amount: string;
  }): Promise<void> {
    const subject = `Payment received: ${payload.payment_id}`;
    const html = `<p>Payment completed.</p><p>Amount: ${payload.amount}</p><p>Payment ID: ${payload.payment_id}</p>`;
    await this.send('provider@example.com', subject, html);
  }

  async sendProviderVerified(payload: { provider_id: string }): Promise<void> {
    const subject = 'Your provider account is verified';
    const html = `<p>Your provider account (${payload.provider_id}) is now active.</p>`;
    await this.send('provider@example.com', subject, html);
  }
}
