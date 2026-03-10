import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class UpdateRetreatSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  discountCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsDateString()
  countdownEndDate?: string;

  @IsOptional()
  @IsUrl()
  bookingUrl?: string;

  @IsOptional()
  @IsUrl()
  bannerImageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  triggerAfterDay?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
