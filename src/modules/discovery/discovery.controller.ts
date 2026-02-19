import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { DiscoveryService } from './discovery.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { ListDiscoveryProvidersQueryDto } from './dto/list-providers-query.dto';

@Controller('discovery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('business_owner', 'business_manager', 'business_staff')
export class DiscoveryController {
  constructor(private discoveryService: DiscoveryService) {}

  @Get('providers')
  async findProviders(
    @CurrentUser() user: RequestContext,
    @Query() query: ListDiscoveryProvidersQueryDto,
  ) {
    const { provider_type, postcode, radius_km, category, ...pagination } = query ?? {};
    return this.discoveryService.findProviders(
      user,
      { provider_type, postcode, radius_km, category },
      pagination ?? {},
    );
  }

  @Get('providers/:id')
  async getProvider(@CurrentUser() user: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.discoveryService.getProviderPublic(user, id);
  }

  @Get('providers/:id/products')
  async getProviderProducts(
    @CurrentUser() user: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.discoveryService.getProviderProducts(user, id, pagination);
  }
}
