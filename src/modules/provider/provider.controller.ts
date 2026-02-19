import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ParseUUIDPipe } from "@nestjs/common/pipes";
import { ProviderService } from "./provider.service";
import { CreateProviderDto } from "./dto/create-provider.dto";
import { UpdateProviderDto } from "./dto/update-provider.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CreateProviderLocationDto } from "./dto/create-location.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Controller("providers")
@UseGuards(JwtAuthGuard)
export class ProviderController {
  constructor(private providerService: ProviderService) {}

  @Post()
  async create(
    @CurrentUser() user: RequestContext,
    @Body() dto: CreateProviderDto,
  ) {
    return this.providerService.create(user.userId, dto);
  }

  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles("provider_owner", "provider_manager", "provider_staff")
  async findOne(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.providerService.findOne(user, id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("provider_owner", "provider_manager")
  async update(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.providerService.update(user, id, dto);
  }

  @Post(":id/products")
  @UseGuards(RolesGuard)
  @Roles("provider_owner", "provider_manager", "provider_staff")
  async addProduct(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.providerService.addProduct(user, id, dto);
  }

  @Get(":id/products")
  @UseGuards(RolesGuard)
  @Roles("provider_owner", "provider_manager", "provider_staff")
  async getProducts(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.providerService.findProducts(user, id, pagination);
  }

  @Patch(":id/products/:productId")
  @UseGuards(RolesGuard)
  @Roles("provider_owner", "provider_manager", "provider_staff")
  async updateProduct(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.providerService.updateProduct(user, id, productId, dto);
  }

  @Delete(":id/products/:productId")
  @UseGuards(RolesGuard)
  @Roles("provider_owner", "provider_manager")
  async deleteProduct(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("productId", ParseUUIDPipe) productId: string,
  ) {
    return this.providerService.deleteProduct(user, id, productId);
  }

  @Post(":id/locations")
  @UseGuards(RolesGuard)
  @Roles("provider_owner", "provider_manager")
  async addLocation(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateProviderLocationDto,
  ) {
    return this.providerService.addLocation(user, id, dto);
  }

  @Get(":id/locations")
  @UseGuards(RolesGuard)
  @Roles("provider_owner", "provider_manager", "provider_staff")
  async getLocations(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.providerService.findLocations(user, id);
  }
}
