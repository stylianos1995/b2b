import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Stripe from 'stripe';
import { Invoice } from '../../entities/invoice.entity';
import { Payment } from '../../entities/payment.entity';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { PaymentEventsProducer } from '../../producers/payment-events.producer';

/**
 * Stripe Checkout and webhook handling.
 * - Checkout: create session, store stripe_session_id on invoice, return session.url.
 * - Webhook: verify signature, on checkout.session.completed find invoice by stripe_session_id,
 *   idempotently mark invoice PAID and create Payment in a transaction, then emit payment.completed.
 */
@Injectable()
export class StripeService {
  private stripe: Stripe | null = null;
  private readonly frontendUrl: string;
  private readonly webhookSecret: string;

  constructor(
    private config: ConfigService,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private dataSource: DataSource,
    private paymentEventsProducer: PaymentEventsProducer,
  ) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    if (secret) {
      this.stripe = new Stripe(secret);
    }
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured (missing STRIPE_SECRET_KEY)');
    }
    return this.stripe;
  }

  /**
   * Ensure the invoice exists, belongs to the buyer's business, and is not already paid.
   * Throws if invalid.
   */
  private async assertInvoicePayableByUser(user: RequestContext, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      select: ['id', 'business_id', 'provider_id', 'status', 'total', 'currency', 'stripe_session_id'],
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    const hasAccess = user.memberships.some((m) => m.businessId === invoice.business_id);
    if (!hasAccess) {
      throw new ForbiddenException('No access to this invoice');
    }
    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice is already paid');
    }
    return invoice as Invoice;
  }

  /**
   * Convert decimal total to smallest currency unit (cents for GBP/USD).
   * Stripe expects amount in cents for GBP.
   */
  private toStripeAmount(total: string, currency: string): number {
    const num = parseFloat(String(total));
    if (!Number.isFinite(num) || num < 0) return 0;
    const lower = currency.toLowerCase();
    const zeroDecimal = ['jpy', 'krw', 'vnd', 'clp'].includes(lower);
    return zeroDecimal ? Math.round(num) : Math.round(num * 100);
  }

  /**
   * Create a Stripe Checkout session for the given invoice.
   * Stores stripe_session_id on the invoice so the webhook can resolve it.
   * Returns the session URL for redirect.
   */
  async createCheckoutSession(user: RequestContext, invoiceId: string): Promise<{ url: string }> {
    const invoice = await this.assertInvoicePayableByUser(user, invoiceId);
    const stripe = this.getStripe();

    const amount = this.toStripeAmount(String(invoice.total), invoice.currency);
    if (amount <= 0) {
      throw new BadRequestException('Invoice total must be greater than zero');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.id}`,
              description: `Payment for invoice`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${this.frontendUrl}/buyer/invoices?success=true`,
      cancel_url: `${this.frontendUrl}/buyer/invoices?canceled=true`,
      metadata: {
        invoice_id: invoiceId,
      },
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    await this.invoiceRepo.update(
      { id: invoiceId },
      { stripe_session_id: session.id },
    );

    return { url: session.url };
  }

  /**
   * Handle Stripe webhook event. Must be called with the raw request body (Buffer) and
   * Stripe-Signature header for verification. Idempotent: if invoice is already PAID, skip.
   */
  async handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
    if (!this.webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }
    const stripe = this.getStripe();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature ?? '', this.webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      throw new BadRequestException(`Stripe webhook signature verification failed: ${message}`);
    }

    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const stripeSessionId = session.id;

    const invoice = await this.invoiceRepo.findOne({
      where: { stripe_session_id: stripeSessionId },
      select: ['id', 'business_id', 'status', 'total', 'currency', 'paid_at'],
    });

    if (!invoice) {
      return;
    }

    if (invoice.status === 'paid' && invoice.paid_at) {
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const inv = await queryRunner.manager.findOne(Invoice, {
        where: { id: invoice.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!inv) {
        await queryRunner.rollbackTransaction();
        return;
      }
      if (inv.status === 'paid') {
        await queryRunner.rollbackTransaction();
        return;
      }

      const paidAt = new Date();
      inv.status = 'paid';
      inv.paid_at = paidAt;
      await queryRunner.manager.save(Invoice, inv);

      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent)?.id ?? null;

      const payment = queryRunner.manager.create(Payment, {
        invoice_id: inv.id,
        business_id: inv.business_id,
        amount: inv.total,
        currency: inv.currency,
        status: 'completed',
        method: 'stripe',
        stripe_payment_intent_id: paymentIntentId,
        external_id: session.payment_intent ? String(session.payment_intent) : null,
        paid_at: paidAt,
        metadata: { stripe_session_id: stripeSessionId },
      });
      await queryRunner.manager.save(Payment, payment);

      await queryRunner.commitTransaction();

      this.paymentEventsProducer.paymentCompleted({
        payment_id: payment.id,
        payable_type: 'invoice',
        payable_id: inv.id,
        amount: String(payment.amount),
      });
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }
}
