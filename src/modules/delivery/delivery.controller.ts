import { Controller, Get, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { ParseUUIDPipe } from "@nestjs/common/pipes";
import { DeliveryService } from "./delivery.service";
import { UpdateDeliveryDto } from "./dto/update-delivery.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequestContext } from "../../common/interfaces/request-context.interface";

@Controller("deliveries")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  "business_owner",
  "business_manager",
  "business_staff",
  "provider_owner",
  "provider_manager",
  "provider_staff",
)
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get(":id")
  async findOne(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.deliveryService.findOne(user, id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("provider_owner", "provider_manager", "provider_staff")
  async update(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryDto,
  ) {
    return this.deliveryService.update(user, id, dto);
  }
}
