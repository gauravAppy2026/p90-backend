import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SaqQuestion, SaqQuestionSchema } from './schemas/saq-question.schema';
import { SaqResponse, SaqResponseSchema } from './schemas/saq-response.schema';
import { SaqService } from './saq.service';
import { SaqController } from './saq.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaqQuestion.name, schema: SaqQuestionSchema },
      { name: SaqResponse.name, schema: SaqResponseSchema },
    ]),
  ],
  providers: [SaqService],
  controllers: [SaqController],
  exports: [SaqService],
})
export class SaqModule {}
