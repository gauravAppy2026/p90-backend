import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;

  // Validate required env vars in production
  if (configService.get('nodeEnv') === 'production') {
    const required = ['jwt.secret', 'jwt.refreshSecret', 'mongodb.uri'];
    for (const key of required) {
      if (!configService.get(key)) {
        throw new Error(`Missing required config: ${key}`);
      }
    }
  }

  // Global pipes, interceptors, filters
  app.useGlobalPipes(ValidationPipe);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS
  const allowedOrigins = [
    'https://p90-admin.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(port);
  console.log(`P90 API running on port ${port}`);
}
bootstrap();
