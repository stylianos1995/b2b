import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { BusinessScopeGuard, BUSINESS_ID_KEY } from '../../auth/guards/business-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('buyer/invoices')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
@Roles('business_owner', 'business_manager', 'business_staff')
export class BuyerInvoicesController {
  constructor(private invoiceService: InvoiceService) {}

  private businessId(req: Request): string {
    return (req as Request & { [BUSINESS_ID_KEY]?: string })[BUSINESS_ID_KEY]!;
  }

  @Get()
  async list(
    @Req() req: Request,
    @CurrentUser() user: RequestContext,
    @Query('status') status?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.invoiceService.listByBusiness(user, this.businessId(req), status, pagination ?? {});
  }
}
