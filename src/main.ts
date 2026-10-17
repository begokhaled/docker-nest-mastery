import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const prefix = configService.get<string>('apiPrefix', 'api/v1');
  const env = configService.get<string>('nodeEnv', 'development');

  // Prefix all routes
  app.setGlobalPrefix(prefix);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Graceful shutdown handling for Docker containers
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  logger.log(`=======================================================`);
  logger.log(`🚀 NestJS Docker Application is running!`);
  logger.log(`🌍 Environment: ${env.toUpperCase()}`);
  logger.log(`📡 URL: http://localhost:${port}/${prefix}`);
  logger.log(`🩺 Health: http://localhost:${port}/${prefix}/health`);
  logger.log(`=======================================================`);
}

bootstrap();
