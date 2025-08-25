import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Security configuration for database and application
 */
export const securityConfig = {
  // Database security settings
  database: {
    // SSL configuration for database connection
    ssl: process.env.NODE_ENV === 'production',
    // Maximum query execution time in milliseconds
    statementTimeout: 30000,
    // Maximum idle transaction time in milliseconds
    idleInTransactionSessionTimeout: 60000,
  },
  
  // Password security settings
  password: {
    // Argon2id configuration for password hashing
    argon2: {
      // Memory cost (in KiB)
      memoryCost: 65536,
      // Time cost (number of iterations)
      timeCost: 3,
      // Parallelism factor
      parallelism: 1,
      // Hash length
      hashLength: 32,
      // Salt length
      saltLength: 16,
    },
  },
  
  // Rate limiting configuration
  rateLimit: {
    // Window time in milliseconds
    windowMs: 15 * 60 * 1000, // 15 minutes
    // Maximum number of requests per window
    max: 100,
  },
};
