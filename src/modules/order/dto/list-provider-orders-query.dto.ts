import { IsOptional, IsInt, Min, Max, IsIn, Matches } from 'class-validator';
import { Type } from 'class-transformer';

const ORDER_STATUSES = ['submitted', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'] as const;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class ListProviderOrdersQueryDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'date_from must be YYYY-MM-DD' })
  date_from?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'date_to must be YYYY-MM-DD' })
  date_to?: string;

  @IsOptional()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
