import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';

@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('platform_admin')
export class AdminPayoutsController {
  constructor(private adminService: AdminService) {}

  @Post()
  async create(@Body() dto: CreatePayoutDto, @IdempotencyKey() idempotencyKey?: string) {
    return this.adminService.createPayout(dto, idempotencyKey);
  }
}
