import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('business_owner', 'business_manager', 'business_staff', 'provider_owner', 'provider_manager', 'provider_staff')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('invoices/:invoiceId/payments')
  @Roles('business_owner', 'business_manager', 'business_staff')
  async create(
    @CurrentUser() user: RequestContext,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: CreatePaymentDto,
    @IdempotencyKey() idempotencyKey?: string,
  ) {
    return this.paymentService.create(user, invoiceId, dto ?? {}, idempotencyKey);
  }

  @Get('payments')
  async list(@CurrentUser() user: RequestContext, @Query() pagination?: PaginationDto) {
    return this.paymentService.listForUser(user, pagination ?? {});
  }
}
