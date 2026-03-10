import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProgress, UserProgressSchema } from './schemas/user-progress.schema';
import { DayContent, DayContentSchema } from './schemas/day-content.schema';
import { ProgramService } from './program.service';
import { ProgramController } from './program.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: DayContent.name, schema: DayContentSchema },
    ]),
  ],
  controllers: [ProgramController],
  providers: [ProgramService],
  exports: [ProgramService],
})
export class ProgramModule {}
