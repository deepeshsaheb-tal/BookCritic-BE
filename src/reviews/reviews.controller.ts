import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiResponse, 
  ApiTags 
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controller for review-related endpoints
 */
@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Create a new review
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ 
    status: 201, 
    description: 'The review has been successfully created.',
    type: Review 
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'User has already reviewed this book.' })
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: any
  ): Promise<Review> {
    return this.reviewsService.create(req.user.id, createReviewDto);
  }

  /**
   * Get all reviews with pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiQuery({ name: 'skip', description: 'Number of items to skip', required: false, type: Number })
  @ApiQuery({ name: 'take', description: 'Number of items to take', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all reviews',
    schema: {
      properties: {
        reviews: {
          type: 'array',
          items: { $ref: '#/components/schemas/Review' }
        },
        total: {
          type: 'number',
          example: 100
        }
      }
    }
  })
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
  ): Promise<{ reviews: Review[]; total: number }> {
    return this.reviewsService.findAll(skip, take);
  }

  /**
   * Get reviews for a specific book
   */
  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get reviews for a specific book' })
  @ApiParam({ name: 'bookId', description: 'Book ID' })
  @ApiQuery({ name: 'skip', description: 'Number of items to skip', required: false, type: Number })
  @ApiQuery({ name: 'take', description: 'Number of items to take', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Return reviews for the specified book',
    schema: {
      properties: {
        reviews: {
          type: 'array',
          items: { $ref: '#/components/schemas/Review' }
        },
        total: {
          type: 'number',
          example: 100
        }
      }
    }
  })
  async findByBookId(
    @Param('bookId') bookId: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
  ): Promise<{ reviews: Review[]; total: number }> {
    return this.reviewsService.findByBookId(bookId, skip, take);
  }

  /**
   * Get reviews by a specific user
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reviews by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'skip', description: 'Number of items to skip', required: false, type: Number })
  @ApiQuery({ name: 'take', description: 'Number of items to take', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Return reviews by the specified user',
    schema: {
      properties: {
        reviews: {
          type: 'array',
          items: { $ref: '#/components/schemas/Review' }
        },
        total: {
          type: 'number',
          example: 100
        }
      }
    }
  })
  async findByUserId(
    @Param('userId') userId: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
  ): Promise<{ reviews: Review[]; total: number }> {
    return this.reviewsService.findByUserId(userId, skip, take);
  }

  /**
   * Get a specific review by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the review',
    type: Review 
  })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  async findOne(@Param('id') id: string): Promise<Review> {
    return this.reviewsService.findOne(id);
  }

  /**
   * Update a review
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'The review has been successfully updated.',
    type: Review 
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the author of the review.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  async update(
    @Param('id') id: string, 
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req: any
  ): Promise<Review> {
    return this.reviewsService.update(id, req.user.id, updateReviewDto);
  }

  /**
   * Delete a review
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 204, description: 'The review has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the author of the review.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<void> {
    return this.reviewsService.remove(id, req.user.id);
  }

  /**
   * Get average rating for a book
   */
  @Get('book/:bookId/average-rating')
  @ApiOperation({ summary: 'Get average rating for a book' })
  @ApiParam({ name: 'bookId', description: 'Book ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the average rating',
    schema: {
      properties: {
        averageRating: {
          type: 'number',
          example: 4.5
        }
      }
    }
  })
  async getAverageRating(@Param('bookId') bookId: string): Promise<{ averageRating: number }> {
    const averageRating = await this.reviewsService.getAverageRating(bookId);
    return { averageRating };
  }
}
