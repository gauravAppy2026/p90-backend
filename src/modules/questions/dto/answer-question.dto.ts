import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { QuestionCategory } from '../schemas/question.schema';

export class AnswerQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  answer: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  // Admin can (re)categorize the question while answering so the
  // public FAQ groups it under the right subject.
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;
}
