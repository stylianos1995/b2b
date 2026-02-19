import { IsUUID } from "class-validator";

/**
 * UUID path param validation (use with ParseUUIDPipe or in DTO for :id routes).
 */
export class IdParamDto {
  @IsUUID("4")
  id: string;
}
