import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '../config/database.config';
import { DatabaseSecurityService } from './database-security.service';
import { PgBouncerService } from './pgbouncer.service';

/**
 * Database module for configuring TypeORM connection
 */
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
  ],
  providers: [DatabaseSecurityService, PgBouncerService],
  exports: [DatabaseSecurityService, PgBouncerService],
})
export class DatabaseModule {}
