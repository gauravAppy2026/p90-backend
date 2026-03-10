import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsNumber,
  IsEnum,
  MaxLength,
} from 'class-validator';
import {
  ResourceType,
  ResourceCategory,
} from '../schemas/resource.schema';

export class CreateResourceDto {
  @IsString()
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsUrl()
  url: string;

  @IsEnum(ResourceType)
  type: ResourceType;

  @IsEnum(ResourceCategory)
  category: ResourceCategory;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
