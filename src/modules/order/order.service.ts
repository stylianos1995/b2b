import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderLine } from '../../entities/order-line.entity';
import { Delivery } from '../../entities/delivery.entity';
import { Location } from '../../entities/location.entity';
import { Product } from '../../entities/product.entity';
import { Provider } from '../../entities/provider.entity';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderEventsProducer } from '../../producers/order-events.producer';
import { IdempotencyStore } from '../../common/idempotency/idempotency.store';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderLine) private orderLineRepo: Repository<OrderLine>,
    @InjectRepository(Delivery) private deliveryRepo: Repository<Delivery>,
    @InjectRepository(Location) private locationRepo: Repository<Location>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Provider) private providerRepo: Repository<Provider>,
    private orderEventsProducer: OrderEventsProducer,
    private idempotencyStore: IdempotencyStore,
  ) {}

  private orderNumber(): string {
    return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  /** Parse size string (e.g. "2L", "500ml", "1kg") to number in base unit. Returns null if unparseable. */
  private sizeToBaseUnit(size: string, baseUnit: string): number | null {
    const s = (size || '').trim();
    const lower = s.toLowerCase();
    if (baseUnit === 'l' || baseUnit === 'lt' || baseUnit === 'litre' || baseUnit === 'liter') {
      if (lower.endsWith('ml')) {
        const n = parseFloat(s.slice(0, -2));
        return Number.isFinite(n) ? n / 1000 : null;
      }
      if (lower.endsWith('l')) {
        const n = parseFloat(s.slice(0, -1));
        return Number.isFinite(n) ? n : null;
      }
    }
    if (baseUnit === 'kg') {
      if (lower.endsWith('g') && !lower.endsWith('kg')) {
        const n = parseFloat(s.slice(0, -1));
        return Number.isFinite(n) ? n / 1000 : null;
      }
      if (lower.endsWith('kg')) {
        const n = parseFloat(s.slice(0, -2));
        return Number.isFinite(n) ? n : null;
      }
    }
    return null;
  }

  private assertBusinessAccess(user: RequestContext, businessId: string): void {
    const m = user.memberships.find((x) => x.businessId === businessId);
    if (!m) throw new ForbiddenException('No access to this business');
  }

  private assertProviderAccess(user: RequestContext, providerId: string): void {
    const m = user.memberships.find((x) => x.providerId === providerId);
    if (!m) throw new ForbiddenException('No access to this provider');
  }

  async placeOrder(
    user: RequestContext,
    businessId: string,
    dto: CreateOrderDto,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const existing = this.idempotencyStore.get(idempotencyKey);
      if (existing) {
        return existing.response as {
          order_id: string;
          order_number: string;
          status: string;
          total: string;
          currency: string;
          created_at: Date;
        };
      }
    }
    this.assertBusinessAccess(user, businessId);
    const location = await this.locationRepo.findOne({
      where: { id: dto.delivery_location_id, owner_type: 'business', owner_id: businessId },
    });
    if (!location) throw new BadRequestException('Delivery location not found or not owned by your business');

    const provider = await this.providerRepo.findOne({
      where: { id: dto.provider_id, status: 'active' },
    });
    if (!provider) throw new BadRequestException('Provider not found');

    const productIds = dto.lines.map((l) => l.product_id);
    const products = await this.productRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids: productIds })
      .andWhere('p.provider_id = :providerId', { providerId: dto.provider_id })
      .select(['p.id', 'p.name', 'p.unit', 'p.price', 'p.tax_rate', 'p.allowed_sizes'])
      .getMany();
    if (products.length !== productIds.length) throw new BadRequestException('One or more products not found or not from this provider');

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const lines: { product_id: string; name: string; quantity: number; unit: string; unit_price: number; tax_rate: number; line_total: number }[] = [];
    for (const line of dto.lines) {
      const p = productMap.get(line.product_id)!;
      const taxRate = Number(p.tax_rate);
      const baseUnit = (p.unit || '').toLowerCase();
      const allowedSizes = p.allowed_sizes ?? [];
      let lineUnit: string;
      let unitPrice: number;
      let qty: number;

      if (allowedSizes.length > 0) {
        if (!line.unit || !allowedSizes.includes(line.unit)) {
          throw new BadRequestException(
            `Product "${p.name}" is only sold in: ${allowedSizes.join(', ')}. Choose one of these sizes.`,
          );
        }
        const sizeInBase = this.sizeToBaseUnit(line.unit, baseUnit);
        if (sizeInBase == null) {
          throw new BadRequestException(`Invalid size "${line.unit}" for product "${p.name}".`);
        }
        if (!Number.isInteger(line.quantity) || line.quantity < 1) {
          throw new BadRequestException(
            `Quantity for "${p.name}" (${line.unit}) must be a whole number.`,
          );
        }
        lineUnit = line.unit;
        unitPrice = Number(p.price) * sizeInBase;
        qty = line.quantity;
      } else {
        lineUnit = p.unit;
        unitPrice = Number(p.price);
        qty = line.quantity;
      }

      const lineTotal = Math.round((unitPrice * qty * (1 + taxRate)) * 100) / 100;
      subtotal += unitPrice * qty;
      lines.push({
        product_id: p.id,
        name: p.name,
        quantity: qty,
        unit: lineUnit,
        unit_price: unitPrice,
        tax_rate: taxRate,
        line_total: lineTotal,
      });
    }
    const taxTotal = lines.reduce((sum, l) => sum + (l.line_total - l.quantity * l.unit_price), 0);
    const total = lines.reduce((sum, l) => sum + l.line_total, 0);
    const currency = products[0]?.currency ?? 'GBP';

    const order = this.orderRepo.create({
      order_number: this.orderNumber(),
      business_id: businessId,
      provider_id: dto.provider_id,
      delivery_location_id: dto.delivery_location_id,
      status: 'submitted',
      subtotal: String(subtotal),
      tax_total: String(taxTotal),
      total: String(total),
      currency,
      requested_delivery_date: new Date(dto.requested_delivery_date),
      notes: dto.notes ?? null,
      submitted_at: new Date(),
    });
    await this.orderRepo.save(order);
    for (const l of lines) {
      await this.orderLineRepo.save(
        this.orderLineRepo.create({
          order_id: order.id,
          line_type: 'product',
          product_id: l.product_id,
          name: l.name,
          quantity: String(l.quantity),
          unit: l.unit,
          unit_price: String(l.unit_price),
          tax_rate: String(l.tax_rate),
          line_total: String(l.line_total),
        }),
      );
    }
    this.orderEventsProducer.orderPlaced({
      order_id: order.id,
      business_id: businessId,
      provider_id: dto.provider_id,
    });
    const result = {
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: order.total,
      currency: order.currency,
      created_at: order.created_at,
    };
    if (idempotencyKey) {
      this.idempotencyStore.set(idempotencyKey, order.id, result);
    }
    return result;
  }

  async listByBusiness(user: RequestContext, businessId: string, status: string | undefined, pagination: PaginationDto) {
    this.assertBusinessAccess(user, businessId);
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.business_id = :businessId', { businessId })
      .orderBy('o.created_at', 'DESC')
      .take(limit + 1)
      .select(['o.id', 'o.order_number', 'o.provider_id', 'o.status', 'o.total', 'o.requested_delivery_date', 'o.created_at']);
    if (status) qb.andWhere('o.status = :status', { status });
    if (pagination.cursor) qb.andWhere('o.id < :cursor', { cursor: pagination.cursor });
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return {
      items: items.map((o) => ({
        order_id: o.id,
        order_number: o.order_number,
        provider_id: o.provider_id,
        status: o.status,
        total: o.total,
        requested_delivery_date: o.requested_delivery_date,
        created_at: o.created_at,
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async findOneByBusiness(user: RequestContext, businessId: string, orderId: string) {
    this.assertBusinessAccess(user, businessId);
    const order = await this.orderRepo.findOne({
      where: { id: orderId, business_id: businessId },
      relations: ['orderLines', 'delivery'],
    });
    if (!order) throw new NotFoundException('Order not found');
    const delivery = order.delivery as Delivery | undefined;
    return {
      order_id: order.id,
      order_number: order.order_number,
      provider_id: order.provider_id,
      delivery_location_id: order.delivery_location_id,
      delivery_id: delivery?.id,
      status: order.status,
      lines: order.orderLines?.map((l) => ({
        product_id: l.product_id,
        name: l.name,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: l.unit_price,
        line_total: l.line_total,
      })) ?? [],
      subtotal: order.subtotal,
      tax_total: order.tax_total,
      total: order.total,
      currency: order.currency,
      requested_delivery_date: order.requested_delivery_date,
      notes: order.notes ?? undefined,
      created_at: order.created_at,
    };
  }

  async cancelByBusiness(user: RequestContext, businessId: string, orderId: string, reason?: string) {
    this.assertBusinessAccess(user, businessId);
    const order = await this.orderRepo.findOne({ where: { id: orderId, business_id: businessId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!['draft', 'submitted'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled');
    }
    order.status = 'cancelled';
    order.cancellation_reason = reason ?? null;
    order.cancelled_at = new Date();
    await this.orderRepo.save(order);
    return { order_id: order.id, status: order.status };
  }

  async listByProvider(
    user: RequestContext,
    providerId: string,
    filters: { status?: string; date_from?: string; date_to?: string },
    pagination: PaginationDto,
  ) {
    this.assertProviderAccess(user, providerId);
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.provider_id = :providerId', { providerId })
      .orderBy('o.created_at', 'DESC')
      .take(limit + 1)
      .select(['o.id', 'o.order_number', 'o.business_id', 'o.status', 'o.total', 'o.currency', 'o.requested_delivery_date', 'o.created_at']);
    if (filters?.status) qb.andWhere('o.status = :status', { status: filters.status });
    if (filters?.date_from) qb.andWhere('o.created_at >= :dateFrom', { dateFrom: `${filters.date_from}T00:00:00.000Z` });
    if (filters?.date_to) {
      const endOfDay = new Date(`${filters.date_to}T23:59:59.999Z`);
      qb.andWhere('o.created_at <= :dateToEnd', { dateToEnd: endOfDay });
    }
    if (pagination.cursor) qb.andWhere('o.id < :cursor', { cursor: pagination.cursor });
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return {
      items: items.map((o) => ({
        order_id: o.id,
        order_number: o.order_number,
        business_id: o.business_id,
        status: o.status,
        total: o.total,
        currency: o.currency,
        requested_delivery_date: o.requested_delivery_date,
        created_at: o.created_at,
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async findOneByProvider(user: RequestContext, providerId: string, orderId: string) {
    this.assertProviderAccess(user, providerId);
    const order = await this.orderRepo.findOne({
      where: { id: orderId, provider_id: providerId },
      relations: ['orderLines', 'deliveryLocation', 'delivery'],
    });
    if (!order) throw new NotFoundException('Order not found');
    const deliveryLocation = order.deliveryLocation as Location | undefined;
    const delivery = order.delivery as Delivery | undefined;
    return {
      order_id: order.id,
      order_number: order.order_number,
      business_id: order.business_id,
      delivery_id: delivery?.id,
      delivery_location: deliveryLocation
        ? {
            address_line_1: deliveryLocation.address_line_1,
            city: deliveryLocation.city,
            postal_code: deliveryLocation.postal_code,
            country: deliveryLocation.country,
          }
        : undefined,
      status: order.status,
      lines: order.orderLines?.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: l.unit_price,
        line_total: l.line_total,
      })) ?? [],
      subtotal: order.subtotal,
      tax_total: order.tax_total,
      total: order.total,
      currency: order.currency,
      requested_delivery_date: order.requested_delivery_date,
      notes: order.notes ?? undefined,
      internal_notes: order.internal_notes ?? undefined,
      created_at: order.created_at,
    };
  }

  async confirm(user: RequestContext, providerId: string, orderId: string, internal_notes?: string) {
    this.assertProviderAccess(user, providerId);
    const order = await this.orderRepo.findOne({ where: { id: orderId, provider_id: providerId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'submitted') throw new BadRequestException('Order cannot be confirmed');
    order.status = 'confirmed';
    order.confirmed_at = new Date();
    if (internal_notes != null) order.internal_notes = internal_notes;
    await this.orderRepo.save(order);
    await this.deliveryRepo.save(
      this.deliveryRepo.create({
        order_id: order.id,
        status: 'scheduled',
      }),
    );
    this.orderEventsProducer.orderConfirmed({
      order_id: order.id,
      business_id: order.business_id,
      provider_id: order.provider_id,
    });
    return { order_id: order.id, status: order.status, confirmed_at: order.confirmed_at };
  }

  async reject(user: RequestContext, providerId: string, orderId: string, reason?: string) {
    this.assertProviderAccess(user, providerId);
    const order = await this.orderRepo.findOne({ where: { id: orderId, provider_id: providerId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'submitted') throw new BadRequestException('Order cannot be rejected');
    order.status = 'cancelled';
    order.cancellation_reason = reason ?? null;
    order.cancelled_at = new Date();
    await this.orderRepo.save(order);
    return { order_id: order.id, status: order.status };
  }

  async updateStatus(
    user: RequestContext,
    providerId: string,
    orderId: string,
    status: 'preparing' | 'shipped',
    internal_notes?: string,
  ) {
    this.assertProviderAccess(user, providerId);
    const order = await this.orderRepo.findOne({ where: { id: orderId, provider_id: providerId } });
    if (!order) throw new NotFoundException('Order not found');
    if (internal_notes != null) order.internal_notes = internal_notes;
    if (status === 'preparing') {
      if (order.status !== 'confirmed') throw new BadRequestException('Order must be confirmed first');
      order.status = 'preparing';
      await this.orderRepo.save(order);
      this.orderEventsProducer.orderPrepared({ order_id: order.id, provider_id: providerId });
    } else {
      if (!['confirmed', 'preparing'].includes(order.status)) throw new BadRequestException('Order cannot be marked shipped');
      order.status = 'shipped';
      await this.orderRepo.save(order);
      this.orderEventsProducer.orderDispatched({
        order_id: order.id,
        business_id: order.business_id,
        provider_id: order.provider_id,
      });
    }
    return { order_id: order.id, status: order.status, updated_at: order.updated_at };
  }
}
