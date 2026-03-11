import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProgramModule } from './modules/program/program.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { TrackerModule } from './modules/tracker/tracker.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { ProductsModule } from './modules/products/products.module';
import { RetreatModule } from './modules/retreat/retreat.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UploadModule } from './modules/upload/upload.module';
import { SeedModule } from './seeds/seed.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    ProgramModule,
    ChecklistModule,
    TrackerModule,
    QuestionsModule,
    TestimonialsModule,
    ResourcesModule,
    ProductsModule,
    RetreatModule,
    AnalyticsModule,
    UploadModule,
    SeedModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
