import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  UseGuards,
  Request,
  DefaultValuePipe,
  ParseIntPipe,
  ParseEnumPipe
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiResponse, 
  ApiTags
} from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Book } from '../books/entities/book.entity';

/**
 * Recommendation types enum
 */
export enum RecommendationType {
  ALL = 'all',
  GENRE_BASED = 'genre-based',
  FAVORITE_BASED = 'favorite-based',
  TOP_RATED = 'top-rated',
  LLM_BASED = 'llm-based'
}

/**
 * Controller for book recommendation endpoints
 */
@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  /**
   * Get personalized book recommendations for the authenticated user
   */
  @Get('for-me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get personalized book recommendations' })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Maximum number of recommendations to return', 
    required: false, 
    type: Number 
  })
  @ApiQuery({
    name: 'type',
    description: 'Type of recommendations to return',
    required: false,
    enum: RecommendationType,
    example: RecommendationType.ALL
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Return recommended books',
    type: [Book]
  })
  async getRecommendationsForUser(
    @Request() req,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('type', new DefaultValuePipe(RecommendationType.ALL)) type: RecommendationType,
  ): Promise<Book[]> {
    const userId = req.user.id;
    
    switch (type) {
      case RecommendationType.GENRE_BASED:
        return this.recommendationsService.getGenreBasedRecommendations(userId, limit);
      case RecommendationType.FAVORITE_BASED:
        return this.recommendationsService.getFavoriteBasedRecommendations(userId, limit);
      case RecommendationType.TOP_RATED:
        return this.recommendationsService.getTopRatedBooks(limit);
      case RecommendationType.LLM_BASED:
        return this.recommendationsService.getLLMRecommendations(userId, limit);
      case RecommendationType.ALL:
      default:
        return this.recommendationsService.getRecommendationsForUser(userId, limit);
    }
  }

  /**
   * Get popular books
   */
  @Get('popular')
  @ApiOperation({ summary: 'Get popular books' })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Maximum number of books to return', 
    required: false, 
    type: Number 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Return popular books',
    type: [Book]
  })
  async getPopularBooks(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Book[]> {
    return this.recommendationsService.getPopularBooks(limit);
  }

  /**
   * Get top-rated books
   */
  @Get('top-rated')
  @ApiOperation({ summary: 'Get top-rated books' })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Maximum number of books to return', 
    required: false, 
    type: Number 
  })
  @ApiQuery({ 
    name: 'minRating', 
    description: 'Minimum average rating', 
    required: false, 
    type: Number 
  })
  @ApiQuery({ 
    name: 'minReviews', 
    description: 'Minimum number of reviews', 
    required: false, 
    type: Number 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Return top-rated books',
    type: [Book]
  })
  async getTopRatedBooks(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Book[]> {
    return this.recommendationsService.getTopRatedBooks(limit);
  }

  /**
   * Get similar books to a specific book
   */
  @Get('similar/:bookId')
  @ApiOperation({ summary: 'Get similar books to a specific book' })
  @ApiParam({ name: 'bookId', description: 'Book ID' })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Maximum number of similar books to return', 
    required: false, 
    type: Number 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Return similar books',
    type: [Book]
  })
  async getSimilarBooks(
    @Param('bookId') bookId: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<Book[]> {
    return this.recommendationsService.getSimilarBooks(bookId, limit);
  }

  /**
   * Get LLM-based recommendations for the authenticated user
   */
  @Get('llm-based')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get LLM-based book recommendations' })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Maximum number of recommendations to return', 
    required: false, 
    type: Number 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Return LLM-based recommended books',
    type: [Book]
  })
  async getLLMRecommendations(
    @Request() req,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Book[]> {
    return this.recommendationsService.getLLMRecommendations(req.user.id, limit);
  }
}
