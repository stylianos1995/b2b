import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { BusinessService } from "./business.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { CreateLocationDto } from "./dto/create-location.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { ParseUUIDPipe } from "@nestjs/common/pipes";

@Controller("businesses")
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Post()
  async create(
    @CurrentUser() user: RequestContext,
    @Body() dto: CreateBusinessDto,
  ) {
    return this.businessService.create(user.userId, dto);
  }

  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles("business_owner", "business_manager", "business_staff")
  async findOne(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.businessService.findOne(user, id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("business_owner", "business_manager")
  async update(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businessService.update(user, id, dto);
  }

  @Post(":id/locations")
  @UseGuards(RolesGuard)
  @Roles("business_owner", "business_manager", "business_staff")
  async addLocation(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.businessService.addLocation(user, id, dto);
  }

  @Get(":id/locations")
  @UseGuards(RolesGuard)
  @Roles("business_owner", "business_manager", "business_staff")
  async getLocations(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.businessService.findLocations(user, id);
  }
}
