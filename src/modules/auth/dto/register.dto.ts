import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
