import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

const PROVIDER_TYPES = [
  'food_wholesaler', 'beverage_distributor', 'coffee_roaster', 'bakery',
  'meat_fish', 'cleaning', 'equipment', 'logistics', 'producer', 'other',
] as const;

export class CreateProviderDto {
  @IsString()
  @MaxLength(255)
  legal_name: string;

  @IsString()
  @MaxLength(255)
  trading_name: string;

  @IsString()
  @MaxLength(50)
  provider_type: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tax_id?: string;

  @IsString()
  @MaxLength(255)
  address_line_1: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  address_line_2?: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @MaxLength(100)
  region: string;

  @IsString()
  @MaxLength(20)
  postal_code: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country: string;
}
