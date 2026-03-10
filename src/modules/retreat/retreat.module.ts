import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RetreatSettings,
  RetreatSettingsSchema,
} from './schemas/retreat-settings.schema';
import { RetreatService } from './retreat.service';
import { RetreatController } from './retreat.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RetreatSettings.name, schema: RetreatSettingsSchema },
    ]),
  ],
  controllers: [RetreatController],
  providers: [RetreatService],
  exports: [RetreatService],
})
export class RetreatModule {}
