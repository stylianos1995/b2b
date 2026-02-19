import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

const BUSINESS_TYPES = ['restaurant', 'cafe', 'bar', 'hotel', 'catering', 'other'] as const;

export class UpdateBusinessDto {
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
  @MaxLength(30)
  @IsIn(BUSINESS_TYPES)
  business_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tax_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  default_currency?: string;
}
