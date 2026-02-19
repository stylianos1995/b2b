import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Provider } from "../../entities/provider.entity";
import { Product } from "../../entities/product.entity";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(Provider) private providerRepo: Repository<Provider>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  private assertBuyer(user: RequestContext): void {
    const hasBuyerRole = user.memberships.some((m) => m.businessId);
    if (!hasBuyerRole) throw new ForbiddenException("Buyer role required");
  }

  async findProviders(
    user: RequestContext,
    filters: {
      provider_type?: string;
      postcode?: string;
      radius_km?: number;
      category?: string;
    },
    pagination: PaginationDto,
  ) {
    this.assertBuyer(user);
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.providerRepo
      .createQueryBuilder("p")
      .where("p.status = :status", { status: "active" })
      .orderBy("p.trading_name", "ASC")
      .take(limit + 1)
      .select(["p.id", "p.trading_name", "p.provider_type"]);
    if (filters.provider_type) {
      qb.andWhere("p.provider_type = :providerType", {
        providerType: filters.provider_type,
      });
    }
    if (filters.category) {
      qb.andWhere(
        "EXISTS (SELECT 1 FROM products pr WHERE pr.provider_id = p.id AND pr.category = :category AND pr.is_active = true)",
        {
          category: filters.category,
        },
      );
    }
    if (filters.postcode) {
      qb.andWhere(
        "EXISTS (SELECT 1 FROM locations l WHERE l.owner_type = :ownerType AND l.owner_id = p.id AND l.postal_code = :postcode)",
        { ownerType: "provider", postcode: filters.postcode },
      );
    }
    if (pagination.cursor) {
      qb.andWhere("p.id > :cursor", { cursor: pagination.cursor });
    }
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    const next_cursor = hasMore ? items[items.length - 1]?.id : undefined;
    return {
      items: items.map((p) => ({
        provider_id: p.id,
        trading_name: p.trading_name,
        provider_type: p.provider_type,
      })),
      next_cursor,
    };
  }

  async getProviderPublic(user: RequestContext, providerId: string) {
    this.assertBuyer(user);
    const provider = await this.providerRepo.findOne({
      where: { id: providerId, status: "active" },
      select: [
        "id",
        "trading_name",
        "provider_type",
        "description",
        "min_order_value",
        "lead_time_hours",
      ],
    });
    if (!provider) throw new NotFoundException("Provider not found");
    return {
      provider_id: provider.id,
      trading_name: provider.trading_name,
      provider_type: provider.provider_type,
      description: provider.description ?? undefined,
      min_order_value: provider.min_order_value ?? undefined,
      lead_time_hours: provider.lead_time_hours ?? undefined,
    };
  }

  async getProviderProducts(
    user: RequestContext,
    providerId: string,
    pagination: PaginationDto,
  ) {
    this.assertBuyer(user);
    const provider = await this.providerRepo.findOne({
      where: { id: providerId, status: "active" },
    });
    if (!provider) return { items: [], next_cursor: undefined };
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.productRepo
      .createQueryBuilder("p")
      .where("p.provider_id = :providerId", { providerId })
      .andWhere("p.is_active = :active", { active: true })
      .orderBy("p.id", "ASC")
      .take(limit + 1)
      .select([
        "p.id",
        "p.name",
        "p.sku",
        "p.category",
        "p.unit",
        "p.unit_size",
        "p.price",
        "p.currency",
        "p.allowed_sizes",
        "p.image_urls",
      ]);
    if (pagination.cursor) {
      qb.andWhere("p.id > :cursor", { cursor: pagination.cursor });
    }
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    const next_cursor = hasMore ? items[items.length - 1]?.id : undefined;
    return {
      items: items.map((p) => ({
        product_id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unit: p.unit,
        unit_size: p.unit_size ?? undefined,
        price: p.price,
        currency: p.currency,
        allowed_sizes: p.allowed_sizes ?? undefined,
        image_urls: p.image_urls ?? undefined,
      })),
      next_cursor,
    };
  }
}
