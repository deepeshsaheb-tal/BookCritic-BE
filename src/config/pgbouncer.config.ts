import * as dotenv from 'dotenv';

dotenv.config();

/**
 * pgBouncer configuration for connection pooling
 */
export const pgBouncerConfig = {
  // Connection settings
  host: process.env.PGBOUNCER_HOST || 'localhost',
  port: parseInt(process.env.PGBOUNCER_PORT || '6432', 10),
  
  // Pool settings
  poolMode: 'transaction', // transaction, statement, or session
  defaultPoolSize: 20,
  minPoolSize: 5,
  reservePoolSize: 5,
  maxClientConn: 100,
  
  // Connection lifetime settings
  serverLifetime: 3600, // Server connection lifetime in seconds
  serverIdleTimeout: 600, // Server idle timeout in seconds
  serverConnectTimeout: 15, // Server connect timeout in seconds
  
  // Authentication settings
  authType: 'md5',
  
  // Logging settings
  logConnections: true,
  logDisconnections: true,
  logPoolerErrors: true,
  
  // Admin console settings
  adminUsers: ['postgres'],
  statsUsers: ['postgres'],
  
  // Database settings
  databases: {
    bookcritic: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dbname: process.env.DB_DATABASE || 'bookcritic',
      pool_size: 20,
    },
  },
};
