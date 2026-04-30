import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { QUESTION_TYPES } from '../schemas/saq-question.schema';
import type { QuestionType } from '../schemas/saq-question.schema';

export class CreateSaqQuestionDto {
  @IsString()
  @MaxLength(500)
  text: string;

  @IsIn(QUESTION_TYPES)
  type: QuestionType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  helpText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholder?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsString()
  @MaxLength(100)
  section: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSaqQuestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  text?: string;

  @IsOptional()
  @IsIn(QUESTION_TYPES)
  type?: QuestionType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  helpText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholder?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  section?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SaveResponseDto {
  @IsObject()
  answers: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  submitted?: boolean;
}
