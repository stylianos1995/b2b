import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Invoice } from "../../entities/invoice.entity";
import { InvoiceLine } from "../../entities/invoice-line.entity";
import { Order } from "../../entities/order.entity";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { PaymentEventsProducer } from "../../producers/payment-events.producer";

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceLine)
    private invoiceLineRepo: Repository<InvoiceLine>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private paymentEventsProducer: PaymentEventsProducer,
  ) {}

  private invoiceNumber(): string {
    return (
      "INV-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 8).toUpperCase()
    );
  }

  private assertProviderAccess(user: RequestContext, providerId: string): void {
    const m = user.memberships.find((x) => x.providerId === providerId);
    if (!m) throw new ForbiddenException("No access to this provider");
  }

  assertCanAccessInvoice(user: RequestContext, invoice: Invoice): void {
    const isProvider = user.memberships.some(
      (m) => m.providerId === invoice.provider_id,
    );
    const isBusiness = user.memberships.some(
      (m) => m.businessId === invoice.business_id,
    );
    if (!isProvider && !isBusiness)
      throw new ForbiddenException("No access to this invoice");
  }

  async create(user: RequestContext, dto: CreateInvoiceDto) {
    const order = await this.orderRepo.findOne({
      where: { id: dto.order_id },
      relations: ["orderLines"],
    });
    if (!order) throw new NotFoundException("Order not found");
    this.assertProviderAccess(user, order.provider_id);
    if (
      !["confirmed", "preparing", "shipped", "delivered"].includes(order.status)
    ) {
      throw new BadRequestException(
        "Invoice can only be created for confirmed or later orders",
      );
    }
    const existingLine = await this.invoiceLineRepo.findOne({
      where: { order_id: order.id },
    });
    if (existingLine)
      throw new BadRequestException("An invoice already exists for this order");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const invoice = this.invoiceRepo.create({
      invoice_number: this.invoiceNumber(),
      provider_id: order.provider_id,
      business_id: order.business_id,
      status: "issued",
      subtotal: order.subtotal,
      tax_total: order.tax_total,
      total: order.total,
      currency: order.currency,
      due_date: dueDate,
      issued_at: new Date(),
      paid_at: null,
    });
    await this.invoiceRepo.save(invoice);
    const lines = order.orderLines ?? [];
    for (const ol of lines) {
      await this.invoiceLineRepo.save(
        this.invoiceLineRepo.create({
          invoice_id: invoice.id,
          order_id: order.id,
          description: ol.name,
          quantity: ol.quantity,
          unit_price: ol.unit_price,
          line_total: ol.line_total,
        }),
      );
    }
    this.paymentEventsProducer.invoiceGenerated({
      invoice_id: invoice.id,
      provider_id: order.provider_id,
      business_id: order.business_id,
      order_ids: [order.id],
    });
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      order_id: order.id,
      business_id: invoice.business_id,
      provider_id: invoice.provider_id,
      status: invoice.status,
      total: invoice.total,
      currency: invoice.currency,
      due_date: invoice.due_date,
      issued_at: invoice.issued_at,
      created_at: invoice.created_at,
    };
  }

  async findOne(user: RequestContext, invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ["invoiceLines"],
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    this.assertCanAccessInvoice(user, invoice);
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      provider_id: invoice.provider_id,
      business_id: invoice.business_id,
      status: invoice.status,
      lines:
        invoice.invoiceLines?.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          line_total: l.line_total,
          order_id: l.order_id,
        })) ?? [],
      subtotal: invoice.subtotal,
      tax_total: invoice.tax_total,
      total: invoice.total,
      currency: invoice.currency,
      due_date: invoice.due_date,
      issued_at: invoice.issued_at ?? undefined,
      paid_at: invoice.paid_at ?? undefined,
      created_at: invoice.created_at,
    };
  }

  async listByBusiness(
    user: RequestContext,
    businessId: string,
    status: string | undefined,
    pagination: PaginationDto,
  ) {
    const m = user.memberships.find((x) => x.businessId === businessId);
    if (!m) throw new ForbiddenException("No access to this business");
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.invoiceRepo
      .createQueryBuilder("i")
      .where("i.business_id = :businessId", { businessId })
      .orderBy("i.created_at", "DESC")
      .take(limit + 1)
      .select([
        "i.id",
        "i.invoice_number",
        "i.provider_id",
        "i.status",
        "i.total",
        "i.currency",
        "i.due_date",
        "i.paid_at",
        "i.created_at",
      ]);
    if (status) qb.andWhere("i.status = :status", { status });
    if (pagination.cursor)
      qb.andWhere("i.id < :cursor", { cursor: pagination.cursor });
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return {
      items: items.map((i) => ({
        invoice_id: i.id,
        invoice_number: i.invoice_number,
        provider_id: i.provider_id,
        status: i.status,
        total: i.total,
        currency: i.currency,
        due_date: i.due_date,
        paid_at: i.paid_at ?? undefined,
        created_at: i.created_at,
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async listByProvider(
    user: RequestContext,
    providerId: string,
    status: string | undefined,
    pagination: PaginationDto,
  ) {
    this.assertProviderAccess(user, providerId);
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.invoiceRepo
      .createQueryBuilder("i")
      .where("i.provider_id = :providerId", { providerId })
      .orderBy("i.created_at", "DESC")
      .take(limit + 1)
      .select([
        "i.id",
        "i.invoice_number",
        "i.business_id",
        "i.status",
        "i.total",
        "i.currency",
        "i.due_date",
        "i.created_at",
      ]);
    if (status) qb.andWhere("i.status = :status", { status });
    if (pagination.cursor)
      qb.andWhere("i.id < :cursor", { cursor: pagination.cursor });
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return {
      items: items.map((i) => ({
        invoice_id: i.id,
        invoice_number: i.invoice_number,
        business_id: i.business_id,
        status: i.status,
        total: i.total,
        currency: i.currency,
        due_date: i.due_date,
        created_at: i.created_at,
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }
}
