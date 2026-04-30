import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyTracker, DailyTrackerSchema } from './schemas/daily-tracker.schema';
import {
  TrackerCategory,
  TrackerCategorySchema,
} from './schemas/tracker-category.schema';
import { TrackerService } from './tracker.service';
import { TrackerController } from './tracker.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyTracker.name, schema: DailyTrackerSchema },
      { name: TrackerCategory.name, schema: TrackerCategorySchema },
    ]),
    GamificationModule,
  ],
  controllers: [TrackerController],
  providers: [TrackerService],
  exports: [TrackerService],
})
export class TrackerModule {}
