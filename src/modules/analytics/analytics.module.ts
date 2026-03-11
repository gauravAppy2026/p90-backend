import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClickEvent, ClickEventSchema } from './schemas/click-event.schema';
import {
  UserProgress,
  UserProgressSchema,
} from '../program/schemas/user-progress.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Question,
  QuestionSchema,
} from '../questions/schemas/question.schema';
import {
  Testimonial,
  TestimonialSchema,
} from '../testimonials/schemas/testimonial.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClickEvent.name, schema: ClickEventSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: User.name, schema: UserSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Testimonial.name, schema: TestimonialSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
