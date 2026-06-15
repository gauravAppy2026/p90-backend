import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SaqQuestion, SaqQuestionSchema } from './schemas/saq-question.schema';
import { SaqResponse, SaqResponseSchema } from './schemas/saq-response.schema';
import {
  SaqWebResponse,
  SaqWebResponseSchema,
} from './schemas/saq-web-response.schema';
import { SaqService } from './saq.service';
import { SaqController, PublicSaqController } from './saq.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaqQuestion.name, schema: SaqQuestionSchema },
      { name: SaqResponse.name, schema: SaqResponseSchema },
      { name: SaqWebResponse.name, schema: SaqWebResponseSchema },
    ]),
  ],
  providers: [SaqService],
  controllers: [SaqController, PublicSaqController],
  exports: [SaqService],
})
export class SaqModule {}
