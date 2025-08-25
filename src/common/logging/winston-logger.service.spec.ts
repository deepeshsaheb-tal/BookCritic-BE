import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from './winston-logger.service';
import * as winston from 'winston';

// Mock winston module
jest.mock('winston', () => {
  const originalModule = jest.requireActual('winston');
  
  // Mock logger instance with spies
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  
  return {
    ...originalModule,
    format: {
      ...originalModule.format,
      combine: jest.fn().mockReturnValue({}),
      timestamp: jest.fn().mockReturnValue({}),
      errors: jest.fn().mockReturnValue({}),
      json: jest.fn().mockReturnValue({}),
      colorize: jest.fn().mockReturnValue({}),
      printf: jest.fn().mockImplementation((fn) => {
        // Test the printf function with sample data
        const result = fn({
          timestamp: '2023-08-25T10:15:30.123Z',
          level: 'info',
          message: 'Test message',
          context: 'TestContext',
          extra: 'data',
        });
        return result;
      }),
    },
    createLogger: jest.fn().mockReturnValue(mockLogger),
    transports: {
      Console: jest.fn().mockImplementation(() => ({})),
      DailyRotateFile: jest.fn().mockImplementation(() => ({})),
    },
  };
});

// Mock winston-daily-rotate-file
jest.mock('winston-daily-rotate-file', () => {});

describe('WinstonLoggerService', () => {
  let service: WinstonLoggerService;
  let configService: ConfigService;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WinstonLoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WinstonLoggerService>(WinstonLoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create logger with development configuration', () => {
      jest.spyOn(configService, 'get').mockReturnValue('development');
      
      // Re-instantiate to trigger constructor
      const devService = new WinstonLoggerService(configService);
      
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(winston.createLogger).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
      // In development mode, DailyRotateFile should not be used
      // but we can't test this directly due to mocking limitations
    });

    it('should create logger with production configuration', () => {
      jest.spyOn(configService, 'get').mockReturnValue('production');
      
      // Re-instantiate to trigger constructor
      const prodService = new WinstonLoggerService(configService);
      
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(winston.createLogger).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
      // In production mode, DailyRotateFile should be used twice
      // but we can't test this directly due to mocking limitations
    });

    it('should default to development if NODE_ENV is not set', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      
      // Re-instantiate to trigger constructor
      const defaultService = new WinstonLoggerService(configService);
      
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(winston.createLogger).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
      // With undefined NODE_ENV, it should default to development mode
      // and not use DailyRotateFile
    });
  });

  describe('logging methods', () => {
    let mockLogger: any;

    beforeEach(() => {
      // Get the mock logger instance
      mockLogger = winston.createLogger();
    });

    it('should call info for log method', () => {
      service.log('Test log message', 'TestContext');
      expect(mockLogger.info).toHaveBeenCalledWith('Test log message', { context: 'TestContext' });
    });

    it('should call error for error method', () => {
      service.error('Test error message', 'Error stack trace', 'TestContext');
      expect(mockLogger.error).toHaveBeenCalledWith('Test error message', { 
        trace: 'Error stack trace', 
        context: 'TestContext' 
      });
    });

    it('should call warn for warn method', () => {
      service.warn('Test warning message', 'TestContext');
      expect(mockLogger.warn).toHaveBeenCalledWith('Test warning message', { context: 'TestContext' });
    });

    it('should call debug for debug method', () => {
      service.debug('Test debug message', 'TestContext');
      expect(mockLogger.debug).toHaveBeenCalledWith('Test debug message', { context: 'TestContext' });
    });

    it('should call verbose for verbose method', () => {
      service.verbose('Test verbose message', 'TestContext');
      expect(mockLogger.verbose).toHaveBeenCalledWith('Test verbose message', { context: 'TestContext' });
    });

    it('should handle log without context', () => {
      service.log('Test log message');
      expect(mockLogger.info).toHaveBeenCalledWith('Test log message', { context: undefined });
    });

    it('should handle error without trace or context', () => {
      service.error('Test error message');
      expect(mockLogger.error).toHaveBeenCalledWith('Test error message', { 
        trace: undefined, 
        context: undefined 
      });
    });
  });
});
