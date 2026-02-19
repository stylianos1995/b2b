import { IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

/**
 * Cursor/limit pagination for list endpoints.
 * Response shape: { data, next_cursor?, has_more }.
 */
export class PaginationDto {
  @IsOptional()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PaginatedResponseDto<T> {
  data: T[];
  next_cursor?: string;
  has_more: boolean;
}
