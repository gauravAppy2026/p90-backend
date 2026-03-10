import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  answer: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
