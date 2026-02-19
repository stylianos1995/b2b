import { IsOptional, IsInt, Min, Max, IsIn, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

const PROVIDER_TYPES = [
  'food_wholesaler',
  'beverage_distributor',
  'coffee_roaster',
  'bakery',
  'meat_fish',
  'cleaning',
  'equipment',
  'logistics',
  'producer',
  'other',
] as const;

export class ListDiscoveryProvidersQueryDto {
  @IsOptional()
  @IsIn(PROVIDER_TYPES)
  provider_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postcode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  radius_km?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
