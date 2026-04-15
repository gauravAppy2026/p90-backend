import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChecklistItemDto {
  @IsString()
  @MaxLength(200)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}

export class CreateDayContentDto {
  @IsNumber()
  @Min(1)
  @Max(30)
  dayNumber: number;

  @IsString()
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsUrl()
  audioUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  textContent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tips?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklistItems?: ChecklistItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reflectionPrompt?: string;

  @IsOptional()
  @IsArray()
  documents?: { title: string; url: string }[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}
