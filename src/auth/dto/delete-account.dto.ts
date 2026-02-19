import { IsString, MinLength } from "class-validator";

export class DeleteAccountDto {
  @IsString()
  @MinLength(1, { message: "Password is required to delete your account" })
  password: string;
}
