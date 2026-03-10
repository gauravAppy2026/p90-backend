import { IsOptional, IsBoolean, IsNumber, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ChecklistItemsDto {
  @IsOptional()
  @IsBoolean()
  p90Session?: boolean;

  @IsOptional()
  @IsBoolean()
  morningSmoothie?: boolean;

  @IsOptional()
  @IsBoolean()
  waterIntake?: boolean;

  @IsOptional()
  @IsBoolean()
  vitaminsMinerals?: boolean;

  @IsOptional()
  @IsBoolean()
  movement?: boolean;

  @IsOptional()
  @IsBoolean()
  mindfulness?: boolean;
}

export class UpdateChecklistDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ChecklistItemsDto)
  items?: ChecklistItemsDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  dayNumber?: number;
}
