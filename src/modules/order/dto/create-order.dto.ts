import { IsString, IsUUID, IsArray, ValidateNested, IsOptional, IsDateString, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderLineDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;

  /** When product has allowed_sizes, this must be the chosen size (e.g. "2L", "500ml"). Quantity is then number of that size. */
  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateOrderDto {
  @IsUUID()
  provider_id: string;

  @IsUUID()
  delivery_location_id: string;

  @IsDateString()
  requested_delivery_date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  lines: CreateOrderLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
