import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyChecklist,
  DailyChecklistSchema,
} from './schemas/daily-checklist.schema';
import {
  ChecklistConfig,
  ChecklistConfigSchema,
} from './schemas/checklist-config.schema';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyChecklist.name, schema: DailyChecklistSchema },
      { name: ChecklistConfig.name, schema: ChecklistConfigSchema },
    ]),
    GamificationModule,
  ],
  controllers: [ChecklistController],
  providers: [ChecklistService],
  exports: [ChecklistService],
})
export class ChecklistModule {}
