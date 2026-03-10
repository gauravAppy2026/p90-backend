import {
  IsOptional,
  IsNumber,
  IsString,
  IsUrl,
  Min,
  Max,
  MaxLength,
  IsObject,
} from 'class-validator';

export class UpdateTrackerDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  energyLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  bodyComfort?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  mindset?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  penTest?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsObject()
  customTrackers?: Record<string, number>;
}
