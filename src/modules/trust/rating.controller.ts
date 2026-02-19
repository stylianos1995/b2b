import { Controller, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ParseUUIDPipe } from "@nestjs/common/pipes";
import { RatingService } from "./rating.service";
import { CreateRatingDto } from "./dto/create-rating.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RequestContext } from "../../common/interfaces/request-context.interface";

@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("business_owner", "business_manager", "business_staff")
export class RatingController {
  constructor(private ratingService: RatingService) {}

  @Post(":id/ratings")
  async create(
    @CurrentUser() user: RequestContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingService.create(user, id, dto);
  }
}
