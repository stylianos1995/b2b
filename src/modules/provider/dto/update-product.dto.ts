import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsUrl,
  MaxLength,
  Min,
  ArrayMaxSize,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit_size?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_sizes?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tax_rate?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsUrl({}, { each: true })
  @MaxLength(2048, { each: true })
  image_urls?: string[];
}
