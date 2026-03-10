import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  text: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  consentToPublish?: boolean;
}
