import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { Book } from '../books/entities/book.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { OpenAIService } from '../common/services/openai.service';
import { FavoritesModule } from '../favorites/favorites.module';

/**
 * Module for book recommendation functionality
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Review, User, UserFavorite]),
    FavoritesModule,
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, OpenAIService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
