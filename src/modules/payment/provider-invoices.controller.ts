import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { InvoiceService } from "./invoice.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import {
  ProviderScopeGuard,
  PROVIDER_ID_KEY,
} from "../../auth/guards/provider-scope.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Controller("provider/invoices")
@UseGuards(JwtAuthGuard, RolesGuard, ProviderScopeGuard)
@Roles("provider_owner", "provider_manager", "provider_staff")
export class ProviderInvoicesController {
  constructor(private invoiceService: InvoiceService) {}

  private providerId(req: Request): string {
    return (req as Request & { [PROVIDER_ID_KEY]?: string })[PROVIDER_ID_KEY]!;
  }

  @Get()
  async list(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Query("status") status?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.invoiceService.listByProvider(
      user,
      this.providerId(req),
      status,
      pagination ?? {},
    );
  }
}
