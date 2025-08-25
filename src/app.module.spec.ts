import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { MiddlewareConsumer } from '@nestjs/common';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

describe('AppModule', () => {
  let appModule: AppModule;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    appModule = module.get<AppModule>(AppModule);
  });

  it('should be defined', () => {
    expect(appModule).toBeDefined();
  });

  describe('configure', () => {
    it('should apply RequestLoggerMiddleware to all routes', () => {
      // Create a mock MiddlewareConsumer
      const mockConsumer = {
        apply: jest.fn().mockReturnThis(),
        forRoutes: jest.fn().mockReturnThis(),
      };

      // Call the configure method with the mock consumer
      appModule.configure(mockConsumer as unknown as MiddlewareConsumer);

      // Verify that apply was called with RequestLoggerMiddleware
      expect(mockConsumer.apply).toHaveBeenCalledWith(RequestLoggerMiddleware);
      
      // Verify that forRoutes was called with '*' (all routes)
      expect(mockConsumer.forRoutes).toHaveBeenCalledWith('*');
    });
  });
});
