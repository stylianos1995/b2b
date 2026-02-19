import {
  IsString,
  IsOptional,
  MaxLength,
  IsIn,
  MinLength,
} from 'class-validator';

const BUSINESS_TYPES = ['restaurant', 'cafe', 'bar', 'hotel', 'catering', 'other'] as const;

export class CreateBusinessDto {
  @IsString()
  @MaxLength(255)
  legal_name: string;

  @IsString()
  @MaxLength(255)
  trading_name: string;

  @IsString()
  @MaxLength(30)
  @IsIn(BUSINESS_TYPES)
  business_type: string;

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
