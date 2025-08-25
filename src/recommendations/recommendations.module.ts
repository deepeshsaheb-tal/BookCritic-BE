import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { Book } from '../books/entities/book.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';

/**
 * Module for book recommendation functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Book, Review, User])],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
