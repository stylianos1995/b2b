import { IsOptional, IsString, IsIn, MaxLength } from "class-validator";

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  @IsIn(["card", "bank_transfer", "other"])
  method?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotency_key?: string;
}
