import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ModuleConfigDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsString()
  @MaxLength(40)
  badge: string;

  @IsOptional()
  @IsUrl()
  moreInfoUrl?: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  welcomeText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bodyText?: string;

  @IsOptional()
  @IsUrl()
  calendlyUrl?: string;
}

export class UpdateSplashConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  appName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  missionStatement?: string;

  @IsOptional()
  @IsUrl()
  heroImageUrl?: string;

  @IsOptional()
  @IsUrl()
  themeBackgroundUrl?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  modules?: {
    quickStart?: ModuleConfigDto;
    thirtyDay?: ModuleConfigDto;
    allIn?: ModuleConfigDto;
  };
}
