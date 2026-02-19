import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  current_password: string;

  @IsString()
  @MinLength(8, { message: "New password must be at least 8 characters" })
  new_password: string;
}
