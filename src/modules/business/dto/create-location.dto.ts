import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateLocationDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(500)
  delivery_instructions?: string;
}
