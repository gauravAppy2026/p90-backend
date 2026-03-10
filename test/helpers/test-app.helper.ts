import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ValidationPipe } from '../../src/common/pipes/validation.pipe';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { ProgramModule } from '../../src/modules/program/program.module';
import { ChecklistModule } from '../../src/modules/checklist/checklist.module';
import { TrackerModule } from '../../src/modules/tracker/tracker.module';
import { QuestionsModule } from '../../src/modules/questions/questions.module';
import { TestimonialsModule } from '../../src/modules/testimonials/testimonials.module';
import { ResourcesModule } from '../../src/modules/resources/resources.module';
import { ProductsModule } from '../../src/modules/products/products.module';
import { RetreatModule } from '../../src/modules/retreat/retreat.module';
import { AnalyticsModule } from '../../src/modules/analytics/analytics.module';
import { UploadModule } from '../../src/modules/upload/upload.module';

export async function createTestApp(mongoUri: string): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => ({
          port: 3001,
          nodeEnv: 'test',
          mongodb: { uri: mongoUri },
          jwt: {
            secret: 'test-jwt-secret',
            expiration: '15m',
            refreshSecret: 'test-refresh-secret',
            refreshExpiration: '7d',
          },
          upload: { dir: '/tmp/p90-test-uploads', maxFileSize: 5242880 },
          admin: { email: 'admin@test.com', password: 'admin123', name: 'Test Admin' },
        })],
      }),
      MongooseModule.forRoot(mongoUri),
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
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(ValidationPipe);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  return app;
}
