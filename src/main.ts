import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { setupSwagger } from './common/swagger/swagger.config';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { WinstonLoggerService } from './common/logging/winston-logger.service';

dotenv.config();

/**
 * Bootstrap the NestJS application
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  
  // Create application with default logger first
  const app = await NestFactory.create(AppModule);
  
  // Then create and set custom logger after app is created
  const configService = app.get(ConfigService);
  app.useLogger(new WinstonLoggerService(configService));
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api/v1');
  
  // Enable CORS
  app.enableCors();
  
  // Set up global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  // Set up global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Set up Swagger documentation
  setupSwagger(app);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
