import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

/**
 * Controller for health check endpoints
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  /**
   * Check overall application health
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not healthy',
  })
  check() {
    return this.health.check([
      // Check database connection
      () => this.db.pingCheck('database'),
      
      // Check memory usage (heap)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      
      // Check disk space
      () => this.disk.checkStorage('disk', { 
        path: '/', 
        thresholdPercent: 0.9, // 90% threshold
      }),
    ]);
  }

  /**
   * Simple ping endpoint for basic availability check
   */
  @Get('ping')
  @ApiOperation({ summary: 'Simple ping endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application is responding',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2023-08-25T10:15:30.123Z' },
      },
    },
  })
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
