import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { QuestionCategory } from '../schemas/question.schema';

export class CreateQuestionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  question: string;

  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;
}
