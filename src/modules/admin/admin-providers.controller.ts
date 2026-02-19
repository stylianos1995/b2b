import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ParseUUIDPipe } from "@nestjs/common/pipes";
import { AdminService } from "./admin.service";
import { UpdateProviderStatusDto } from "./dto/update-provider-status.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Controller("admin/providers")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("platform_admin")
export class AdminProvidersController {
  constructor(private adminService: AdminService) {}

  @Get()
  async list(@Query() pagination?: PaginationDto) {
    return this.adminService.listProviders(pagination ?? {});
  }

  @Patch(":id")
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProviderStatusDto,
  ) {
    return this.adminService.updateProviderStatus(id, dto);
  }
}
