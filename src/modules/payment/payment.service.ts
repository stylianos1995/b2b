import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payment } from "../../entities/payment.entity";
import { Invoice } from "../../entities/invoice.entity";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { PaymentEventsProducer } from "../../producers/payment-events.producer";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    private paymentEventsProducer: PaymentEventsProducer,
  ) {}

  private assertBusinessAccess(user: RequestContext, businessId: string): void {
    const m = user.memberships.find((x) => x.businessId === businessId);
    if (!m) throw new ForbiddenException("No access to this business");
  }

  async create(
    user: RequestContext,
    invoiceId: string,
    dto: CreatePaymentDto,
    idempotencyKey?: string,
  ) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    this.assertBusinessAccess(user, invoice.business_id);
    if (invoice.status === "paid")
      throw new BadRequestException("Invoice is already paid");

    if (idempotencyKey) {
      const withKey = await this.paymentRepo
        .createQueryBuilder("p")
        .where("p.invoice_id = :invoiceId", { invoiceId })
        .andWhere("p.metadata->>'idempotency_key' = :key", {
          key: idempotencyKey,
        })
        .getOne();
      if (withKey) {
        return {
          payment_id: withKey.id,
          invoice_id: withKey.invoice_id,
          amount: withKey.amount,
          currency: withKey.currency,
          status: withKey.status,
          method: withKey.method,
          created_at: withKey.created_at,
        };
      }
    }

    const method = dto.method ?? "card";
    const payment = this.paymentRepo.create({
      invoice_id: invoiceId,
      business_id: invoice.business_id,
      amount: invoice.total,
      currency: invoice.currency,
      status: "completed",
      method,
      external_id: null,
      metadata: idempotencyKey ? { idempotency_key: idempotencyKey } : null,
      paid_at: new Date(),
    });
    await this.paymentRepo.save(payment);

    invoice.status = "paid";
    invoice.paid_at = new Date();
    await this.invoiceRepo.save(invoice);

    this.paymentEventsProducer.paymentCompleted({
      payment_id: payment.id,
      payable_type: "invoice",
      payable_id: invoiceId,
      amount: String(payment.amount),
    });

    return {
      payment_id: payment.id,
      invoice_id: payment.invoice_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      paid_at: payment.paid_at,
      created_at: payment.created_at,
    };
  }

  async listForUser(user: RequestContext, pagination: PaginationDto) {
    const businessIds = user.memberships
      .filter((m) => m.businessId)
      .map((m) => m.businessId!);
    const providerIds = user.memberships
      .filter((m) => m.providerId)
      .map((m) => m.providerId!);
    if (businessIds.length === 0 && providerIds.length === 0) {
      return { items: [], next_cursor: undefined };
    }
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.paymentRepo
      .createQueryBuilder("p")
      .orderBy("p.created_at", "DESC")
      .take(limit + 1)
      .select([
        "p.id",
        "p.invoice_id",
        "p.business_id",
        "p.amount",
        "p.currency",
        "p.status",
        "p.method",
        "p.paid_at",
        "p.created_at",
      ]);

    if (businessIds.length > 0 && providerIds.length > 0) {
      qb.leftJoin(Invoice, "i", "i.id = p.invoice_id").where(
        "(p.business_id IN (:...businessIds) OR i.provider_id IN (:...providerIds))",
        { businessIds, providerIds },
      );
    } else if (businessIds.length > 0) {
      qb.where("p.business_id IN (:...businessIds)", { businessIds });
    } else {
      qb.innerJoin(Invoice, "i", "i.id = p.invoice_id").where(
        "i.provider_id IN (:...providerIds)",
        { providerIds },
      );
    }
    if (pagination.cursor)
      qb.andWhere("p.id < :cursor", { cursor: pagination.cursor });
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return {
      items: items.map((p) => ({
        payment_id: p.id,
        invoice_id: p.invoice_id,
        business_id: p.business_id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        method: p.method,
        paid_at: p.paid_at ?? undefined,
        created_at: p.created_at,
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }
}
