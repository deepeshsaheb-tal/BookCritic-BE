import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { pgBouncerConfig } from '../config/pgbouncer.config';

/**
 * Service for managing pgBouncer connection pooling
 */
@Injectable()
export class PgBouncerService implements OnModuleInit {
  private readonly logger = new Logger(PgBouncerService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Initialize pgBouncer connection pooling
   */
  async onModuleInit(): Promise<void> {
    try {
      // Configure connection pooling settings
      await this.configureConnectionPooling();
      this.logger.log('pgBouncer connection pooling configured successfully');
    } catch (error) {
      this.logger.error(`Failed to configure pgBouncer connection pooling: ${error.message}`);
    }
  }

  /**
   * Configure connection pooling settings
   */
  private async configureConnectionPooling(): Promise<void> {
    try {
      // Set connection timeout (standard PostgreSQL parameter)
      await this.dataSource.query(`SET statement_timeout = ${pgBouncerConfig.serverConnectTimeout * 1000}`);
      
      // Set idle in transaction timeout (standard PostgreSQL parameter)
      await this.dataSource.query(`SET idle_in_transaction_session_timeout = ${pgBouncerConfig.serverIdleTimeout * 1000}`);
      
      // Log connection pool settings (we don't set pool_size directly as it's pgBouncer-specific)
      this.logger.log(`Using connection pool with size: ${pgBouncerConfig.defaultPoolSize}`);
      this.logger.log('Database connection settings configured');
    } catch (error) {
      this.logger.error(`Error configuring connection settings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get connection pool statistics
   */
  async getPoolStats(): Promise<any> {
    try {
      // This would typically connect to pgBouncer's admin console
      // For demonstration purposes, we're using a query to get connection stats
      const stats = await this.dataSource.query(`
        SELECT 
          count(*) as total_connections,
          sum(case when state = 'active' then 1 else 0 end) as active_connections,
          sum(case when state = 'idle' then 1 else 0 end) as idle_connections
        FROM pg_stat_activity
      `);
      
      return stats[0];
    } catch (error) {
      this.logger.error(`Error getting pool stats: ${error.message}`);
      throw error;
    }
  }
}
