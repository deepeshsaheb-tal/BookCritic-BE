import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, QueryRunner } from 'typeorm';

/**
 * Creates a mock repository with basic CRUD operations
 * @param entity - Entity to create mock repository for
 * @returns Mock repository
 */
export function createMockRepository<T = any>(): Partial<Repository<T>> {
  // Create a properly typed mock query builder
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    execute: jest.fn(),
    // Add other required methods from SelectQueryBuilder as needed
  } as unknown as SelectQueryBuilder<T>;
  
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn((_alias?: string, _queryRunner?: QueryRunner) => mockQueryBuilder),
  };
}

/**
 * Creates a mock service with provided methods
 * @param methods - Methods to include in the mock service
 * @returns Mock service
 */
export function createMockService<T = any>(methods: Record<string, jest.Mock> = {}): Partial<T> {
  return methods as unknown as Partial<T>;
}

/**
 * Creates a testing module with provided options
 * @param metadata - Module metadata
 * @returns Test module
 */
export async function createTestingModule(metadata: ModuleMetadata) {
  const moduleRef = await Test.createTestingModule(metadata).compile();
  return moduleRef;
}

/**
 * Provides a mock repository for an entity
 * @param entity - Entity class
 * @returns Provider object
 */
export function provideMockRepository<T = any>(entity: any) {
  return {
    provide: getRepositoryToken(entity),
    useFactory: createMockRepository<T>,
  };
}

/**
 * Creates a mock JWT service
 * @returns Mock JWT service
 */
export function createMockJwtService() {
  return {
    sign: jest.fn(() => 'test-token'),
    verify: jest.fn(),
  };
}

/**
 * Creates a mock config service
 * @param config - Configuration object
 * @returns Mock config service
 */
export function createMockConfigService(config: Record<string, any> = {}) {
  return {
    get: jest.fn((key: string) => config[key]),
  };
}

/**
 * Creates a mock logger
 * @returns Mock logger
 */
export function createMockLogger() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
}
