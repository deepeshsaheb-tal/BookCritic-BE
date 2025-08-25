import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let typeOrmHealthIndicator: TypeOrmHealthIndicator;
  let memoryHealthIndicator: MemoryHealthIndicator;
  let diskHealthIndicator: DiskHealthIndicator;

  // Mock health check response
  const mockHealthCheckResponse = {
    status: 'ok',
    info: {
      database: {
        status: 'up',
      },
      memory_heap: {
        status: 'up',
      },
      disk: {
        status: 'up',
      },
    },
    error: {},
    details: {
      database: {
        status: 'up',
      },
      memory_heap: {
        status: 'up',
      },
      disk: {
        status: 'up',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn().mockResolvedValue(mockHealthCheckResponse),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: jest.fn().mockResolvedValue({
              database: {
                status: 'up',
              },
            }),
          },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn().mockResolvedValue({
              memory_heap: {
                status: 'up',
              },
            }),
          },
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: jest.fn().mockResolvedValue({
              disk: {
                status: 'up',
              },
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    typeOrmHealthIndicator = module.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);
    memoryHealthIndicator = module.get<MemoryHealthIndicator>(MemoryHealthIndicator);
    diskHealthIndicator = module.get<DiskHealthIndicator>(DiskHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check status', async () => {
      const result = await controller.check();
      
      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result).toEqual(mockHealthCheckResponse);
      
      // Verify that the health check was called with the correct indicators
      const checkCall = jest.mocked(healthCheckService.check).mock.calls[0][0];
      expect(checkCall).toHaveLength(3); // Three health check functions
      
      // Execute each health check function to verify they call the correct indicators
      await checkCall[0]();
      await checkCall[1]();
      await checkCall[2]();
      
      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
      expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith('memory_heap', 300 * 1024 * 1024);
      expect(diskHealthIndicator.checkStorage).toHaveBeenCalledWith('disk', {
        path: '/',
        thresholdPercent: 0.9,
      });
    });
  });

  describe('ping', () => {
    it('should return ok status with timestamp', () => {
      // Mock Date.now for consistent testing
      const mockDate = new Date('2023-08-25T10:15:30.123Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const result = controller.ping();
      
      expect(result).toEqual({
        status: 'ok',
        timestamp: '2023-08-25T10:15:30.123Z',
      });
      
      // Restore Date
      jest.restoreAllMocks();
    });
  });
});
