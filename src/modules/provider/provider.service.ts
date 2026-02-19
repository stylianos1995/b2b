import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Provider } from "../../entities/provider.entity";
import { Location } from "../../entities/location.entity";
import { Product } from "../../entities/product.entity";
import { ProviderUser } from "../../entities/provider-user.entity";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { CreateProviderDto } from "./dto/create-provider.dto";
import { UpdateProviderDto } from "./dto/update-provider.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CreateProviderLocationDto } from "./dto/create-location.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { ProviderEventsProducer } from "../../producers/provider-events.producer";

const PROVIDER_ROLES = ["provider_owner", "provider_manager", "provider_staff"];
const EDIT_ROLES = ["provider_owner", "provider_manager"];

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider) private providerRepo: Repository<Provider>,
    @InjectRepository(Location) private locationRepo: Repository<Location>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProviderUser)
    private providerUserRepo: Repository<ProviderUser>,
    private providerEventsProducer: ProviderEventsProducer,
  ) {}

  private async assertAccess(
    user: RequestContext,
    providerId: string,
    allowedRoles?: string[],
  ): Promise<void> {
    const membership = user.memberships.find(
      (m) => m.providerId === providerId,
    );
    if (!membership) throw new ForbiddenException("No access to this provider");
    if (allowedRoles?.length && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException("Insufficient role");
    }
  }

  async create(
    userId: string,
    dto: CreateProviderDto,
  ): Promise<{ provider_id: string; status: string; created_at: Date }> {
    const provider = this.providerRepo.create({
      legal_name: dto.legal_name,
      trading_name: dto.trading_name,
      provider_type: dto.provider_type,
      tax_id: dto.tax_id ?? null,
      status: "pending_verification",
      default_currency: "GBP",
    });
    await this.providerRepo.save(provider);

    const location = this.locationRepo.create({
      address_line_1: dto.address_line_1,
      address_line_2: dto.address_line_2 ?? null,
      city: dto.city,
      region: dto.region,
      postal_code: dto.postal_code,
      country: dto.country,
      location_type: "warehouse",
      owner_type: "provider",
      owner_id: provider.id,
      is_default: true,
    });
    await this.locationRepo.save(location);

    await this.providerUserRepo.save(
      this.providerUserRepo.create({
        user_id: userId,
        provider_id: provider.id,
        role: "provider_owner",
      }),
    );

    return {
      provider_id: provider.id,
      status: provider.status,
      created_at: provider.created_at,
    };
  }

  async findOne(user: RequestContext, id: string) {
    await this.assertAccess(user, id, PROVIDER_ROLES);
    const provider = await this.providerRepo.findOne({
      where: { id },
      select: [
        "id",
        "legal_name",
        "trading_name",
        "provider_type",
        "status",
        "default_currency",
        "created_at",
      ],
    });
    if (!provider) throw new NotFoundException("Provider not found");
    return {
      provider_id: provider.id,
      legal_name: provider.legal_name,
      trading_name: provider.trading_name,
      provider_type: provider.provider_type,
      status: provider.status,
      default_currency: provider.default_currency,
      created_at: provider.created_at,
    };
  }

  async update(user: RequestContext, id: string, dto: UpdateProviderDto) {
    await this.assertAccess(user, id, EDIT_ROLES);
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) throw new NotFoundException("Provider not found");
    if (dto.legal_name != null) provider.legal_name = dto.legal_name;
    if (dto.trading_name != null) provider.trading_name = dto.trading_name;
    if (dto.provider_type != null) provider.provider_type = dto.provider_type;
    if (dto.tax_id !== undefined) provider.tax_id = dto.tax_id ?? null;
    if (dto.description !== undefined)
      provider.description = dto.description ?? null;
    if (dto.default_currency != null)
      provider.default_currency = dto.default_currency;
    await this.providerRepo.save(provider);
    return { provider_id: provider.id, updated_at: provider.updated_at };
  }

  async addProduct(
    user: RequestContext,
    providerId: string,
    dto: CreateProductDto,
  ) {
    await this.assertAccess(user, providerId, PROVIDER_ROLES);
    const provider = await this.providerRepo.findOne({
      where: { id: providerId },
    });
    if (!provider) throw new NotFoundException("Provider not found");
    const existing = await this.productRepo.findOne({
      where: { provider_id: providerId, sku: dto.sku },
    });
    if (existing)
      throw new ConflictException("Product with this SKU already exists");
    const product = this.productRepo.create({
      provider_id: providerId,
      sku: dto.sku,
      name: dto.name.trim(),
      category: dto.category,
      unit: dto.unit,
      unit_size: dto.unit_size ?? null,
      allowed_sizes: dto.allowed_sizes?.length ? dto.allowed_sizes : null,
      price: String(dto.price),
      currency: dto.currency,
      tax_rate: String(dto.tax_rate),
      description: dto.description ?? null,
      is_active: true,
      image_urls: dto.image_urls?.length ? dto.image_urls.slice(0, 3) : null,
    });
    await this.productRepo.save(product);
    this.providerEventsProducer.productCreated({
      product_id: product.id,
      provider_id: providerId,
    });
    return { product_id: product.id, created_at: product.created_at };
  }

  async findProducts(
    user: RequestContext,
    providerId: string,
    pagination: PaginationDto,
  ) {
    await this.assertAccess(user, providerId, PROVIDER_ROLES);
    const limit = Math.min(pagination.limit ?? 20, 100);
    const qb = this.productRepo
      .createQueryBuilder("p")
      .where("p.provider_id = :providerId", { providerId })
      .orderBy("p.id", "DESC")
      .take(limit + 1)
      .select([
        "p.id",
        "p.sku",
        "p.name",
        "p.category",
        "p.unit",
        "p.price",
        "p.currency",
        "p.is_active",
        "p.allowed_sizes",
        "p.image_urls",
      ]);
    if (pagination.cursor) {
      qb.andWhere("p.id < :cursor", { cursor: pagination.cursor });
    }
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    const next_cursor = hasMore ? items[items.length - 1]?.id : undefined;
    return {
      items: items.map((p) => ({
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit,
        price: p.price,
        currency: p.currency,
        is_active: p.is_active,
        allowed_sizes: p.allowed_sizes ?? undefined,
        image_urls: p.image_urls ?? undefined,
      })),
      next_cursor,
    };
  }

  async updateProduct(
    user: RequestContext,
    providerId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    await this.assertAccess(user, providerId, PROVIDER_ROLES);
    const product = await this.productRepo.findOne({
      where: { id: productId, provider_id: providerId },
    });
    if (!product) throw new NotFoundException("Product not found");
    if (dto.name != null) product.name = dto.name;
    if (dto.category != null) product.category = dto.category;
    if (dto.unit != null) product.unit = dto.unit;
    if (dto.unit_size !== undefined) product.unit_size = dto.unit_size ?? null;
    if (dto.allowed_sizes !== undefined)
      product.allowed_sizes = dto.allowed_sizes?.length
        ? dto.allowed_sizes
        : null;
    if (dto.price != null) product.price = String(dto.price);
    if (dto.tax_rate != null) product.tax_rate = String(dto.tax_rate);
    if (dto.description !== undefined)
      product.description = dto.description ?? null;
    if (dto.is_active !== undefined) product.is_active = dto.is_active;
    if (dto.image_urls !== undefined)
      product.image_urls = dto.image_urls?.length
        ? dto.image_urls.slice(0, 3)
        : null;
    await this.productRepo.save(product);
    return { product_id: product.id, updated_at: product.updated_at };
  }

  async deleteProduct(
    user: RequestContext,
    providerId: string,
    productId: string,
  ): Promise<void> {
    await this.assertAccess(user, providerId, EDIT_ROLES);
    const product = await this.productRepo.findOne({
      where: { id: productId, provider_id: providerId },
    });
    if (!product) throw new NotFoundException("Product not found");
    await this.productRepo.remove(product);
  }

  async addLocation(
    user: RequestContext,
    providerId: string,
    dto: CreateProviderLocationDto,
  ) {
    await this.assertAccess(user, providerId, EDIT_ROLES);
    const provider = await this.providerRepo.findOne({
      where: { id: providerId },
    });
    if (!provider) throw new NotFoundException("Provider not found");
    const location = this.locationRepo.create({
      address_line_1: dto.address_line_1,
      address_line_2: dto.address_line_2 ?? null,
      city: dto.city,
      region: dto.region,
      postal_code: dto.postal_code,
      country: dto.country,
      location_type: "warehouse",
      owner_type: "provider",
      owner_id: providerId,
      is_default: false,
    });
    await this.locationRepo.save(location);
    return { location_id: location.id, created_at: location.created_at };
  }

  async findLocations(user: RequestContext, providerId: string) {
    await this.assertAccess(user, providerId, PROVIDER_ROLES);
    const locations = await this.locationRepo.find({
      where: { owner_type: "provider", owner_id: providerId },
      select: ["id", "address_line_1", "city", "postal_code", "country"],
      order: { is_default: "DESC" },
    });
    return {
      items: locations.map((l) => ({
        location_id: l.id,
        address_line_1: l.address_line_1,
        city: l.city,
        postal_code: l.postal_code,
        country: l.country,
      })),
    };
  }
}
