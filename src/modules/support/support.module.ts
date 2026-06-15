import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';

@Module({
  imports: [ConfigModule],
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}
