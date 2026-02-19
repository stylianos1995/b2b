import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password: string;

  @IsString()
  @MaxLength(100)
  first_name: string;

  @IsString()
  @MaxLength(100)
  last_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
}
