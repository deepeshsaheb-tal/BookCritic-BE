import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Database configuration options for TypeORM
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'bookcritic',
  schema: process.env.DB_SCHEMA || 'public',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: process.env.NODE_ENV === 'production',
  migrationsTableName: 'migrations',
  // TypeORM v3 no longer supports the cli property
  // Migration directories are now configured in the DataSource
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pooling configuration
  extra: {
    // Maximum number of clients the pool should contain
    max: 20,
    // Connection timeout in milliseconds
    connectionTimeoutMillis: 0,
    // Idle timeout in milliseconds
    idleTimeoutMillis: 0,
  },
};
