import {
  IsString,
  IsOptional,
  MaxLength,
  IsIn,
  IsNumber,
  Min,
  ValidateIf,
} from "class-validator";
import { Type } from "class-transformer";

const PROVIDER_TYPES = [
  "food_wholesaler",
  "beverage_distributor",
  "coffee_roaster",
  "bakery",
  "meat_fish",
  "cleaning",
  "equipment",
  "logistics",
  "producer",
  "other",
] as const;

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legal_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  trading_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @IsIn([...PROVIDER_TYPES])
  provider_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tax_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  default_currency?: string;

  /** Minimum order total (in default_currency). Orders below this are rejected. Leave empty for no minimum. */
  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== "")
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_order_value?: number | null;
}
