import { IsUUID, IsOptional, IsNumber, IsString, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayoutDto {
  @IsUUID()
  provider_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}
