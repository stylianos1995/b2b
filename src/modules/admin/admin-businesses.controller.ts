import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { AdminService } from './admin.service';
import { UpdateBusinessStatusDto } from './dto/update-business-status.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('admin/businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('platform_admin')
export class AdminBusinessesController {
  constructor(private adminService: AdminService) {}

  @Get()
  async list(@Query() pagination?: PaginationDto) {
    return this.adminService.listBusinesses(pagination ?? {});
  }

  @Patch(':id')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBusinessStatusDto) {
    return this.adminService.updateBusinessStatus(id, dto);
  }
}
