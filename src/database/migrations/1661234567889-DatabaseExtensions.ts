import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create necessary PostgreSQL extensions
 */
export class DatabaseExtensions1661234567889 implements MigrationInterface {
  name = 'DatabaseExtensions1661234567889';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create UUID extension for generating UUIDs
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create pg_trgm extension for text search
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop extensions
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pg_trgm"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
