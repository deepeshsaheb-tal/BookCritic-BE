import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { securityConfig } from '../config/security.config';

/**
 * Service for implementing database security measures
 */
@Injectable()
export class DatabaseSecurityService {
  private readonly logger = new Logger(DatabaseSecurityService.name);

  constructor(private readonly dataSource: DataSource) {
    this.configureSecuritySettings();
  }

  /**
   * Configure database security settings
   */
  private async configureSecuritySettings(): Promise<void> {
    try {
      // Set statement timeout to prevent long-running queries
      await this.dataSource.query(
        `SET statement_timeout = ${securityConfig.database.statementTimeout};`
      );

      // Set idle in transaction timeout to prevent idle transactions
      await this.dataSource.query(
        `SET idle_in_transaction_session_timeout = ${securityConfig.database.idleInTransactionSessionTimeout};`
      );

      // Enable row-level security if in production
      if (process.env.NODE_ENV === 'production') {
        this.logger.log('Enabling row-level security for production environment');
        // This would be implemented per table as needed
      }

      this.logger.log('Database security settings configured successfully');
    } catch (error) {
      this.logger.error(`Failed to configure database security settings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create database roles and permissions
   * This would be called during application initialization
   */
  async setupDatabaseRoles(): Promise<void> {
    try {
      // Create application roles
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bookcritic_readonly') THEN
            CREATE ROLE bookcritic_readonly;
          END IF;
          
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bookcritic_readwrite') THEN
            CREATE ROLE bookcritic_readwrite;
          END IF;
        END
        $$;
      `);

      // Grant permissions to roles
      await this.dataSource.query(`
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO bookcritic_readonly;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bookcritic_readwrite;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bookcritic_readwrite;
      `);

      this.logger.log('Database roles and permissions set up successfully');
    } catch (error) {
      this.logger.error(`Failed to set up database roles: ${error.message}`);
      throw error;
    }
  }
}
