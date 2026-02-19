import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Delivery } from "../../entities/delivery.entity";
import { Order } from "../../entities/order.entity";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { UpdateDeliveryDto } from "./dto/update-delivery.dto";
import { DeliveryEventsProducer } from "../../producers/delivery-events.producer";

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery) private deliveryRepo: Repository<Delivery>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private deliveryEventsProducer: DeliveryEventsProducer,
  ) {}

  private async assertCanAccessDelivery(
    user: RequestContext,
    deliveryId: string,
  ): Promise<{ order: Order; delivery: Delivery }> {
    const delivery = await this.deliveryRepo.findOne({
      where: { id: deliveryId },
      relations: ["order"],
    });
    if (!delivery) throw new NotFoundException("Delivery not found");
    const order = delivery.order as Order;
    if (!order) throw new NotFoundException("Order not found");
    const isBuyer = user.memberships.some(
      (m) => m.businessId === order.business_id,
    );
    const isProvider = user.memberships.some(
      (m) => m.providerId === order.provider_id,
    );
    if (!isBuyer && !isProvider)
      throw new ForbiddenException("No access to this delivery");
    return { order, delivery };
  }

  async findOne(user: RequestContext, id: string) {
    const { delivery } = await this.assertCanAccessDelivery(user, id);
    return {
      delivery_id: delivery.id,
      order_id: delivery.order_id,
      status: delivery.status,
      tracking_code: delivery.tracking_code ?? undefined,
      estimated_delivery_at: delivery.estimated_delivery_at ?? undefined,
      actual_delivery_at: delivery.actual_delivery_at ?? undefined,
      updated_at: delivery.updated_at,
    };
  }

  async update(user: RequestContext, id: string, dto: UpdateDeliveryDto) {
    const { order, delivery } = await this.assertCanAccessDelivery(user, id);
    const isProvider = user.memberships.some(
      (m) => m.providerId === order.provider_id,
    );
    if (!isProvider)
      throw new ForbiddenException("Only provider can update delivery status");
    delivery.status = dto.status;
    if (dto.tracking_code !== undefined)
      delivery.tracking_code = dto.tracking_code;
    if (dto.estimated_delivery_at !== undefined)
      delivery.estimated_delivery_at = new Date(dto.estimated_delivery_at);
    if (dto.actual_delivery_at !== undefined)
      delivery.actual_delivery_at = new Date(dto.actual_delivery_at);
    await this.deliveryRepo.save(delivery);
    if (dto.status === "delivered") {
      order.delivered_at = new Date();
      await this.orderRepo.save(order);
      this.deliveryEventsProducer.orderDelivered({
        order_id: order.id,
        delivery_id: delivery.id,
        business_id: order.business_id,
        provider_id: order.provider_id,
      });
    }
    return {
      delivery_id: delivery.id,
      order_id: delivery.order_id,
      status: delivery.status,
      updated_at: delivery.updated_at,
    };
  }
}
