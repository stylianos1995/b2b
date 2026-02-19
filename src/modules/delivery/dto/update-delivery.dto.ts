import {
  IsString,
  IsIn,
  IsOptional,
  IsDateString,
  MaxLength,
} from "class-validator";

export class UpdateDeliveryDto {
  @IsString()
  @IsIn(["scheduled", "picked_up", "in_transit", "delivered", "failed"])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tracking_code?: string;

  @IsOptional()
  @IsDateString()
  estimated_delivery_at?: string;

  @IsOptional()
  @IsDateString()
  actual_delivery_at?: string;
}
