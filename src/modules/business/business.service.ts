import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Business } from "../../entities/business.entity";
import { Location } from "../../entities/location.entity";
import { BusinessUser } from "../../entities/business-user.entity";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { CreateLocationDto } from "./dto/create-location.dto";
import { BusinessEventsProducer } from "../../producers/business-events.producer";

const BUYER_ROLES = ["business_owner", "business_manager", "business_staff"];
const EDIT_ROLES = ["business_owner", "business_manager"];

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Location) private locationRepo: Repository<Location>,
    @InjectRepository(BusinessUser)
    private businessUserRepo: Repository<BusinessUser>,
    private businessEventsProducer: BusinessEventsProducer,
  ) {}

  private async assertAccess(
    user: RequestContext,
    businessId: string,
    allowedRoles?: string[],
  ): Promise<void> {
    const membership = user.memberships.find(
      (m) => m.businessId === businessId,
    );
    if (!membership) throw new ForbiddenException("No access to this business");
    if (allowedRoles?.length && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException("Insufficient role");
    }
  }

  async create(
    userId: string,
    dto: CreateBusinessDto,
  ): Promise<{ business_id: string; created_at: Date }> {
    const business = this.businessRepo.create({
      legal_name: dto.legal_name,
      trading_name: dto.trading_name,
      business_type: dto.business_type,
      tax_id: dto.tax_id ?? null,
      status: "pending_verification",
      default_currency: "GBP",
    });
    await this.businessRepo.save(business);

    const location = this.locationRepo.create({
      address_line_1: dto.address_line_1,
      address_line_2: dto.address_line_2 ?? null,
      city: dto.city,
      region: dto.region,
      postal_code: dto.postal_code,
      country: dto.country,
      location_type: "delivery_address",
      owner_type: "business",
      owner_id: business.id,
      is_default: true,
    });
    await this.locationRepo.save(location);

    business.default_delivery_address_id = location.id;
    await this.businessRepo.save(business);

    await this.businessUserRepo.save(
      this.businessUserRepo.create({
        user_id: userId,
        business_id: business.id,
        role: "business_owner",
      }),
    );

    this.businessEventsProducer.businessCreated({
      business_id: business.id,
      owner_user_id: userId,
    });
    return { business_id: business.id, created_at: business.created_at };
  }

  async findOne(user: RequestContext, id: string) {
    await this.assertAccess(user, id, BUYER_ROLES);
    const business = await this.businessRepo.findOne({
      where: { id },
      select: [
        "id",
        "legal_name",
        "trading_name",
        "business_type",
        "status",
        "default_currency",
        "default_delivery_address_id",
        "created_at",
      ],
    });
    if (!business) throw new NotFoundException("Business not found");
    return {
      business_id: business.id,
      legal_name: business.legal_name,
      trading_name: business.trading_name,
      business_type: business.business_type,
      status: business.status,
      default_currency: business.default_currency,
      default_delivery_address_id: business.default_delivery_address_id,
      created_at: business.created_at,
    };
  }

  async update(user: RequestContext, id: string, dto: UpdateBusinessDto) {
    await this.assertAccess(user, id, EDIT_ROLES);
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException("Business not found");
    if (dto.legal_name != null) business.legal_name = dto.legal_name;
    if (dto.trading_name != null) business.trading_name = dto.trading_name;
    if (dto.business_type != null) business.business_type = dto.business_type;
    if (dto.tax_id !== undefined) business.tax_id = dto.tax_id ?? null;
    if (dto.default_currency != null)
      business.default_currency = dto.default_currency;
    await this.businessRepo.save(business);
    return { business_id: business.id, updated_at: business.updated_at };
  }

  async addLocation(
    user: RequestContext,
    businessId: string,
    dto: CreateLocationDto,
  ) {
    await this.assertAccess(user, businessId, BUYER_ROLES);
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException("Business not found");
    const location = this.locationRepo.create({
      address_line_1: dto.address_line_1,
      address_line_2: dto.address_line_2 ?? null,
      city: dto.city,
      region: dto.region,
      postal_code: dto.postal_code,
      country: dto.country,
      delivery_instructions: dto.delivery_instructions ?? null,
      location_type: "delivery_address",
      owner_type: "business",
      owner_id: businessId,
      is_default: false,
    });
    await this.locationRepo.save(location);
    return { location_id: location.id, created_at: location.created_at };
  }

  async findLocations(user: RequestContext, businessId: string) {
    await this.assertAccess(user, businessId, BUYER_ROLES);
    const locations = await this.locationRepo.find({
      where: { owner_type: "business", owner_id: businessId },
      select: [
        "id",
        "address_line_1",
        "city",
        "postal_code",
        "country",
        "is_default",
      ],
      order: { is_default: "DESC" },
    });
    return {
      items: locations.map((l) => ({
        location_id: l.id,
        address_line_1: l.address_line_1,
        city: l.city,
        postal_code: l.postal_code,
        country: l.country,
        is_default: l.is_default,
      })),
    };
  }
}
