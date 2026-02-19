import { IsString, IsNumber, IsOptional, IsArray, IsUrl, MaxLength, Min, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  sku: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(50)
  category: string;

  @IsString()
  @MaxLength(20)
  unit: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit_size?: string;

  /** When set, product is only sold in these sizes (e.g. ["500ml", "1L", "2L", "5L", "10L"]). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_sizes?: string[];

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsString()
  @MaxLength(3)
  currency: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tax_rate: number;

  @IsOptional()
  @IsString()
  description?: string;

  /** Up to 3 image URLs. Recommended: JPEG/PNG/WebP, max 800×800px, under 500KB each. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsUrl({}, { each: true })
  @MaxLength(2048, { each: true })
  image_urls?: string[];
}
