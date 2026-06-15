import { IsString, MaxLength, MinLength } from 'class-validator';

export class ContactSupportDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  subject: string;

  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  message: string;
}
