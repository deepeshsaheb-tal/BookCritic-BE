import { Test } from '@nestjs/testing';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { setupSwagger } from './common/swagger/swagger.config';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { WinstonLoggerService } from './common/logging/winston-logger.service';
import { AppModule } from './app.module';

// Mock the NestFactory
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

// Mock the setupSwagger function
jest.mock('./common/swagger/swagger.config', () => ({
  setupSwagger: jest.fn(),
}));

// Mock dotenv.config
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Bootstrap', () => {
  // Mock app object
  const mockApp = {
    get: jest.fn(),
    useLogger: jest.fn(),
    setGlobalPrefix: jest.fn(),
    enableCors: jest.fn(),
    useGlobalPipes: jest.fn(),
    useGlobalFilters: jest.fn(),
    listen: jest.fn(),
  };

  // Mock config service
  const mockConfigService = {
    get: jest.fn(),
  };

  // Mock logger
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  // Store original process.env and console.error
  const originalEnv = process.env;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Setup mocks for this test
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    mockApp.get.mockReturnValue(mockConfigService);
    
    // Mock Logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    
    // Mock console.error for bootstrap catch handler
    console.error = jest.fn();
    
    // Set test environment variables
    process.env = { ...originalEnv, PORT: '3001' };
  });

  afterEach(() => {
    // Restore original process.env and console.error
    process.env = originalEnv;
    console.error = originalConsoleError;
  });

  it('should bootstrap the application successfully', async () => {
    // We need to dynamically import main.ts to test the bootstrap function
    // This is because the bootstrap function is called immediately when the module is imported
    jest.isolateModules(async () => {
      // Import the module (which will call bootstrap)
      await import('./main');
      
      // Verify NestFactory.create was called with AppModule
      expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
      
      // Verify app configuration methods were called
      expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
      expect(mockApp.enableCors).toHaveBeenCalled();
      expect(mockApp.useGlobalPipes).toHaveBeenCalled();
      expect(mockApp.useGlobalFilters).toHaveBeenCalled();
      
      // Verify Swagger setup was called
      expect(setupSwagger).toHaveBeenCalledWith(mockApp);
      
      // Verify app.listen was called with the correct port
      expect(mockApp.listen).toHaveBeenCalledWith('3001');
    });
  });

  it('should handle bootstrap errors', async () => {
    // Make NestFactory.create throw an error
    const testError = new Error('Test bootstrap error');
    (NestFactory.create as jest.Mock).mockRejectedValue(testError);
    
    // Mock process.exit to prevent the test from actually exiting
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process.exit(${code})`);
    });
    
    jest.isolateModules(async () => {
      try {
        await import('./main');
      } catch (error) {
        // Verify error handling
        expect(console.error).toHaveBeenCalledWith('Error starting server:', testError);
        expect(mockExit).toHaveBeenCalledWith(1);
      }
    });
    
    // Restore process.exit
    mockExit.mockRestore();
  });
});
