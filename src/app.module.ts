import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';
import { ReviewsModule } from './reviews/reviews.module';
import { GenresModule } from './genres/genres.module';
import { AuthModule } from './auth/auth.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { FavoritesModule } from './favorites/favorites.module';
import { HealthModule } from './common/health/health.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

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
    // Application modules
    UsersModule,
    BooksModule,
    ReviewsModule,
    GenresModule,
    AuthModule,
    RecommendationsModule,
    FavoritesModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  /**
   * Configure global middleware
   * @param consumer - Middleware consumer
   */
  configure(consumer: MiddlewareConsumer): void {
    // Apply request logger middleware to all routes
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
