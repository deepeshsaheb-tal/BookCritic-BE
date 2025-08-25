import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Mock process.env
const originalEnv = process.env;

describe('DataSource Configuration', () => {
  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  afterAll(() => {
    // Restore process.env
    process.env = originalEnv;
  });

  it('should use default values when environment variables are not set', () => {
    // Clear relevant environment variables
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_DATABASE;
    delete process.env.DB_SCHEMA;
    delete process.env.NODE_ENV;

    // Re-import to get fresh config with our environment
    const { dataSourceOptions: options } = require('./data-source');

    expect(options.type).toBe('postgres');
    expect(options.host).toBe('localhost');
    expect(options.port).toBe(5432);
    expect(options.username).toBe('postgres');
    expect(options.password).toBe('postgres');
    expect(options.database).toBe('bookcritic');
    expect(options.schema).toBe('public');
    expect(options.synchronize).toBe(false);
    expect(options.migrationsTableName).toBe('migrations');
    expect(options.ssl).toBe(false);
  });

  it('should use environment variables when they are set', () => {
    // Set environment variables
    process.env.DB_HOST = 'test-host';
    process.env.DB_PORT = '5433';
    process.env.DB_USERNAME = 'test-user';
    process.env.DB_PASSWORD = 'test-password';
    process.env.DB_DATABASE = 'test-db';
    process.env.DB_SCHEMA = 'test-schema';

    // Re-import to get fresh config with our environment
    const { dataSourceOptions: options } = require('./data-source');

    expect(options.host).toBe('test-host');
    expect(options.port).toBe(5433);
    expect(options.username).toBe('test-user');
    expect(options.password).toBe('test-password');
    expect(options.database).toBe('test-db');
    expect(options.schema).toBe('test-schema');
  });

  it('should configure SSL for production environment', () => {
    // Set production environment
    process.env.NODE_ENV = 'production';

    // Re-import to get fresh config with our environment
    const { dataSourceOptions: options } = require('./data-source');

    expect(options.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('should export a DataSource instance', () => {
    // Import the default export
    const dataSource = require('./data-source').default;
    
    // Check if it has the expected DataSource properties instead of using instanceof
    expect(dataSource).toHaveProperty('options');
    expect(dataSource).toHaveProperty('initialize');
    expect(dataSource).toHaveProperty('query');
  });
});
