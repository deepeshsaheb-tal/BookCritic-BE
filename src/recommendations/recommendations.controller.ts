import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  UseGuards,
  Request,
  DefaultValuePipe,
  ParseIntPipe
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
  @ApiResponse({ 
    status: 200, 
    description: 'Return recommended books',
    type: [Book]
  })
  async getRecommendationsForUser(
    @Request() req,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Book[]> {
    return this.recommendationsService.getRecommendationsForUser(req.user.id, limit);
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
}
