import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyChecklist,
  DailyChecklistSchema,
} from './schemas/daily-checklist.schema';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyChecklist.name, schema: DailyChecklistSchema },
    ]),
  ],
  controllers: [ChecklistController],
  providers: [ChecklistService],
  exports: [ChecklistService],
})
export class ChecklistModule {}
