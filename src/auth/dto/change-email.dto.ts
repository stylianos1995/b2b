import { IsEmail, IsString, MinLength } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail()
  new_email: string;

  @IsString()
  @MinLength(1, { message: 'Password is required to change email' })
  password: string;
}
