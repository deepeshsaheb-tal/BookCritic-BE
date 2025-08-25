import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

/**
 * Module for health check functionality
 */
@Module({
  imports: [
    TerminusModule,
    HttpModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
