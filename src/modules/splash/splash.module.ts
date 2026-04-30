import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SplashConfig, SplashConfigSchema } from './schemas/splash-config.schema';
import { SplashService } from './splash.service';
import { SplashController } from './splash.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SplashConfig.name, schema: SplashConfigSchema }]),
  ],
  providers: [SplashService],
  controllers: [SplashController],
  exports: [SplashService],
})
export class SplashModule {}
