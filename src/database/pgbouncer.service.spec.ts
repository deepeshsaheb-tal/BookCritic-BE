import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { PgBouncerService } from './pgbouncer.service';
import { Logger } from '@nestjs/common';
import { pgBouncerConfig } from '../config/pgbouncer.config';

// Mock the pgbouncer config
jest.mock('../config/pgbouncer.config', () => ({
  pgBouncerConfig: {
    defaultPoolSize: 10,
    serverConnectTimeout: 5,
    serverIdleTimeout: 30
  }
}));

describe('PgBouncerService', () => {
  let service: PgBouncerService;
  let dataSource: DataSource;
  let loggerSpy: jest.SpyInstance;
  let errorLoggerSpy: jest.SpyInstance;

  // Mock DataSource
  const mockDataSource = {
    query: jest.fn().mockResolvedValue([{ 
      total_connections: 10, 
      active_connections: 3, 
      idle_connections: 7 
    }]),
  };

  beforeEach(async () => {
    // Mock Logger
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    errorLoggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PgBouncerService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PgBouncerService>(PgBouncerService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should configure connection pooling on initialization', async () => {
      await service.onModuleInit();
      
      expect(dataSource.query).toHaveBeenCalledWith(`SET statement_timeout = ${pgBouncerConfig.serverConnectTimeout * 1000}`);
      expect(dataSource.query).toHaveBeenCalledWith(`SET idle_in_transaction_session_timeout = ${pgBouncerConfig.serverIdleTimeout * 1000}`);
      expect(loggerSpy).toHaveBeenCalledWith('pgBouncer connection pooling configured successfully');
      expect(loggerSpy).toHaveBeenCalledWith(`Using connection pool with size: ${pgBouncerConfig.defaultPoolSize}`);
    });

    it('should handle errors during initialization', async () => {
      const mockError = new Error('Connection error');
      jest.spyOn(dataSource, 'query').mockRejectedValueOnce(mockError);
      
      await service.onModuleInit();
      
      expect(errorLoggerSpy).toHaveBeenCalledWith('Failed to configure pgBouncer connection pooling: Connection error');
    });
  });

  describe('configureConnectionPooling', () => {
    it('should configure connection pooling settings', async () => {
      // Call the private method using any type assertion
      await (service as any).configureConnectionPooling();
      
      expect(dataSource.query).toHaveBeenCalledWith(`SET statement_timeout = ${pgBouncerConfig.serverConnectTimeout * 1000}`);
      expect(dataSource.query).toHaveBeenCalledWith(`SET idle_in_transaction_session_timeout = ${pgBouncerConfig.serverIdleTimeout * 1000}`);
      expect(loggerSpy).toHaveBeenCalledWith(`Using connection pool with size: ${pgBouncerConfig.defaultPoolSize}`);
      expect(loggerSpy).toHaveBeenCalledWith('Database connection settings configured');
    });

    it('should handle errors when configuring connection settings', async () => {
      const mockError = new Error('Configuration error');
      jest.spyOn(dataSource, 'query').mockRejectedValueOnce(mockError);
      
      await expect(async () => {
        await (service as any).configureConnectionPooling();
      }).rejects.toThrow('Configuration error');
      
      expect(errorLoggerSpy).toHaveBeenCalledWith('Error configuring connection settings: Configuration error');
    });
  });

  describe('getPoolStats', () => {
    it('should return connection pool statistics', async () => {
      const stats = await service.getPoolStats();
      
      expect(stats).toEqual({
        total_connections: 10,
        active_connections: 3,
        idle_connections: 7
      });
      
      expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should handle errors when getting pool stats', async () => {
      const mockError = new Error('Stats error');
      jest.spyOn(dataSource, 'query').mockRejectedValueOnce(mockError);
      
      await expect(service.getPoolStats()).rejects.toThrow('Stats error');
      expect(errorLoggerSpy).toHaveBeenCalledWith('Error getting pool stats: Stats error');
    });
  });
});
