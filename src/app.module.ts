import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';

/**
 * Root application module
 */
@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Database module
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
