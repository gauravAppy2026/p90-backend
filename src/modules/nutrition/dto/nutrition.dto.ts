import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NutritionSectionDto {
  @IsString()
  @IsIn(['livingFoods', 'hydration', 'simpleGuidance'])
  key: 'livingFoods' | 'hydration' | 'simpleGuidance';

  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsBoolean()
  isActive: boolean;

  @IsInt()
  order: number;
}

export class UpdateNutritionContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headerTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  headerSubtitle?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NutritionSectionDto)
  sections?: NutritionSectionDto[];
}
