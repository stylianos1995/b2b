import { IsString, IsOptional, MaxLength } from "class-validator";

export class ConfirmOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  internal_notes?: string;
}
