import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ParseUUIDPipe } from "@nestjs/common/pipes";
import { Request } from "express";
import { OrderService } from "./order.service";
import { ConfirmOrderDto } from "./dto/confirm-order.dto";
import { RejectOrderDto } from "./dto/reject-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import {
  ProviderScopeGuard,
  PROVIDER_ID_KEY,
} from "../../auth/guards/provider-scope.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { ListProviderOrdersQueryDto } from "./dto/list-provider-orders-query.dto";

@Controller("provider/orders")
@UseGuards(JwtAuthGuard, RolesGuard, ProviderScopeGuard)
@Roles("provider_owner", "provider_manager", "provider_staff")
export class ProviderOrdersController {
  constructor(private orderService: OrderService) {}

  private providerId(req: Request): string {
    return (req as Request & { [PROVIDER_ID_KEY]?: string })[PROVIDER_ID_KEY]!;
  }

  @Get()
  async list(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Query() query: ListProviderOrdersQueryDto,
  ) {
    const { status, date_from, date_to, ...pagination } = query ?? {};
    return this.orderService.listByProvider(
      user,
      this.providerId(req),
      { status, date_from, date_to },
      pagination ?? {},
    );
  }

  @Get(":id")
  async findOne(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.orderService.findOneByProvider(user, this.providerId(req), id);
  }

  @Post(":id/confirm")
  async confirm(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ConfirmOrderDto,
  ) {
    return this.orderService.confirm(
      user,
      this.providerId(req),
      id,
      dto?.internal_notes,
    );
  }

  @Post(":id/reject")
  async reject(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RejectOrderDto,
  ) {
    return this.orderService.reject(
      user,
      this.providerId(req),
      id,
      dto?.reason,
    );
  }

  @Patch(":id")
  async updateStatus(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(
      user,
      this.providerId(req),
      id,
      dto.status,
      dto.internal_notes,
    );
  }
}
