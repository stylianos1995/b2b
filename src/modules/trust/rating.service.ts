import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '../../entities/rating.entity';
import { Order } from '../../entities/order.entity';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { CreateRatingDto } from './dto/create-rating.dto';
import { TrustEventsProducer } from '../../producers/trust-events.producer';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating) private ratingRepo: Repository<Rating>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private trustEventsProducer: TrustEventsProducer,
  ) {}

  async create(user: RequestContext, orderId: string, dto: CreateRatingDto) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const hasAccess = user.memberships.some((m) => m.businessId === order.business_id);
    if (!hasAccess) throw new ForbiddenException('Order does not belong to your business');
    if (order.status !== 'delivered') {
      throw new BadRequestException('Only delivered orders can be rated');
    }
    const existing = await this.ratingRepo.findOne({ where: { order_id: orderId } });
    if (existing) throw new ConflictException('This order has already been rated');

    const rating = this.ratingRepo.create({
      order_id: orderId,
      business_id: order.business_id,
      provider_id: order.provider_id,
      rating: dto.rating,
      comment: dto.comment ?? null,
      dimensions: null,
      is_visible: true,
    });
    await this.ratingRepo.save(rating);
    this.trustEventsProducer.ratingSubmitted({
      rating_id: rating.id,
      order_id: orderId,
      business_id: order.business_id,
      provider_id: order.provider_id,
      rating: dto.rating,
    });
    return {
      rating_id: rating.id,
      order_id: rating.order_id,
      provider_id: rating.provider_id,
      rating: rating.rating,
      created_at: rating.created_at,
    };
  }
}
