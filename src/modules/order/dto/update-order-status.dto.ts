import { IsString, IsIn, IsOptional, MaxLength } from "class-validator";

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(["preparing", "shipped"])
  status: "preparing" | "shipped";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  internal_notes?: string;
}
