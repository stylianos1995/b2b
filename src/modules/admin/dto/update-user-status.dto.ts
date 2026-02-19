import { IsString, IsIn } from "class-validator";

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(["active", "suspended"])
  status: string;
}
