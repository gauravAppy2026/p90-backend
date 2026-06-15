import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  UserProgress,
  UserProgressSchema,
} from '../program/schemas/user-progress.schema';
import {
  DailyTracker,
  DailyTrackerSchema,
} from '../tracker/schemas/daily-tracker.schema';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: DailyTracker.name, schema: DailyTrackerSchema },
    ]),
  ],
  providers: [ParticipantsService],
  controllers: [ParticipantsController],
})
export class ParticipantsModule {}
