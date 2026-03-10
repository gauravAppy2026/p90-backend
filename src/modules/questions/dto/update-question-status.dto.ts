import { IsEnum } from 'class-validator';
import { QuestionStatus } from '../schemas/question.schema';

export class UpdateQuestionStatusDto {
  @IsEnum(QuestionStatus)
  status: QuestionStatus;
}
