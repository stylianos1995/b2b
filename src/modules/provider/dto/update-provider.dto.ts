import { IsString, IsOptional, MaxLength } from 'class-validator';

const PROVIDER_TYPES = [
  'food_wholesaler', 'beverage_distributor', 'coffee_roaster', 'bakery',
  'meat_fish', 'cleaning', 'equipment', 'logistics', 'producer', 'other',
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
}
