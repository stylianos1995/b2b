import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Business } from '../../entities/business.entity';
import { Provider } from '../../entities/provider.entity';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateBusinessStatusDto } from './dto/update-business-status.dto';
import { UpdateProviderStatusDto } from './dto/update-provider-status.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProviderEventsProducer } from '../../producers/provider-events.producer';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Provider) private providerRepo: Repository<Provider>,
    private providerEventsProducer: ProviderEventsProducer,
  ) {}

  async listUsers(pagination: PaginationDto) {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.userRepo
      .createQueryBuilder('u')
      .orderBy('u.created_at', 'DESC')
      .take(limit + 1)
      .select(['u.id', 'u.email', 'u.first_name', 'u.last_name', 'u.status', 'u.created_at']);
    if (pagination.cursor) qb.andWhere('u.id < :cursor', { cursor: pagination.cursor });
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return {
      items: items.map((u) => ({
        user_id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        status: u.status,
        created_at: u.created_at,
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.status = dto.status;
    await this.userRepo.save(user);
    return { user_id: user.id, status: user.status, updated_at: user.updated_at };
  }

  async listBusinesses(pagination: PaginationDto) {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.businessRepo
      .createQueryBuilder('b')
      .orderBy('b.created_at', 'DESC')
      .take(limit + 1)
      .select(['b.id', 'b.legal_name', 'b.trading_name', 'b.business_type', 'b.status', 'b.created_at']);
    if (pagination.cursor) qb.andWhere('b.id < :cursor', { cursor: pagination.cursor });
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return {
      items: items.map((b) => ({
        business_id: b.id,
        legal_name: b.legal_name,
        trading_name: b.trading_name,
        business_type: b.business_type,
        status: b.status,
        created_at: b.created_at,
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async updateBusinessStatus(businessId: string, dto: UpdateBusinessStatusDto) {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    business.status = dto.status;
    await this.businessRepo.save(business);
    return { business_id: business.id, status: business.status, updated_at: business.updated_at };
  }

  async listProviders(pagination: PaginationDto) {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.providerRepo
      .createQueryBuilder('p')
      .orderBy('p.created_at', 'DESC')
      .take(limit + 1)
      .select(['p.id', 'p.legal_name', 'p.trading_name', 'p.provider_type', 'p.status', 'p.created_at']);
    if (pagination.cursor) qb.andWhere('p.id < :cursor', { cursor: pagination.cursor });
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return {
      items: items.map((p) => ({
        provider_id: p.id,
        legal_name: p.legal_name,
        trading_name: p.trading_name,
        provider_type: p.provider_type,
        status: p.status,
        created_at: p.created_at,
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  async updateProviderStatus(providerId: string, dto: UpdateProviderStatusDto) {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');
    const wasActive = provider.status === 'active';
    provider.status = dto.status;
    await this.providerRepo.save(provider);
    if (dto.status === 'active' && !wasActive) {
      this.providerEventsProducer.providerVerified({ provider_id: providerId });
    }
    return { provider_id: provider.id, status: provider.status, updated_at: provider.updated_at };
  }

  async createPayout(dto: CreatePayoutDto, idempotencyKey?: string) {
    const provider = await this.providerRepo.findOne({ where: { id: dto.provider_id } });
    if (!provider) throw new NotFoundException('Provider not found');
    const amount = dto.amount ?? Number(provider.min_order_value ?? 0);
    const currency = dto.currency ?? provider.default_currency;
    const payoutId = crypto.randomUUID();
    const executedAt = new Date();
    return {
      payout_id: payoutId,
      provider_id: dto.provider_id,
      amount: String(amount),
      currency,
      status: 'completed',
      executed_at: executedAt,
    };
  }
}
