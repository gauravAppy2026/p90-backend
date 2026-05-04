import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  QuickStartVideo,
  QuickStartVideoSchema,
} from './schemas/quick-start-video.schema';
import {
  QuickStartConfig,
  QuickStartConfigSchema,
} from './schemas/quick-start-config.schema';
import { QuickStartService } from './quick-start.service';
import { QuickStartController } from './quick-start.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuickStartVideo.name, schema: QuickStartVideoSchema },
      { name: QuickStartConfig.name, schema: QuickStartConfigSchema },
    ]),
  ],
  providers: [QuickStartService],
  controllers: [QuickStartController],
  exports: [QuickStartService],
})
export class QuickStartModule {}
