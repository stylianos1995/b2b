import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ParseUUIDPipe } from "@nestjs/common/pipes";
import { Request } from "express";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import {
  BusinessScopeGuard,
  BUSINESS_ID_KEY,
} from "../../auth/guards/business-scope.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { IdempotencyKey } from "../../common/decorators/idempotency-key.decorator";

@Controller("buyer/orders")
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
@Roles("business_owner", "business_manager", "business_staff")
export class BuyerOrdersController {
  constructor(private orderService: OrderService) {}

  private businessId(req: Request): string {
    return (req as Request & { [BUSINESS_ID_KEY]?: string })[BUSINESS_ID_KEY]!;
  }

  @Post()
  async create(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Body() dto: CreateOrderDto,
    @IdempotencyKey() idempotencyKey?: string,
  ) {
    return this.orderService.placeOrder(
      user,
      this.businessId(req),
      dto,
      idempotencyKey,
    );
  }

  @Get()
  async list(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Query("status") status?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.orderService.listByBusiness(
      user,
      this.businessId(req),
      status,
      pagination ?? {},
    );
  }

  @Get(":id")
  async findOne(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.orderService.findOneByBusiness(user, this.businessId(req), id);
  }

  @Post(":id/cancel")
  async cancel(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancelByBusiness(
      user,
      this.businessId(req),
      id,
      dto?.reason,
    );
  }
}
