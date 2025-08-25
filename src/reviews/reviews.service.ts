import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

/**
 * Service for managing review operations
 */
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  /**
   * Create a new review
   * @param userId - ID of the user creating the review
   * @param createReviewDto - Review creation data
   * @returns The created review entity
   */
  async create(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    this.logger.log(`Creating new review for book ${createReviewDto.bookId} by user ${userId}`);
    
    // Check if user already reviewed this book
    const existingReview = await this.reviewsRepository.findOne({
      where: {
        userId,
        bookId: createReviewDto.bookId,
      },
    });
    
    if (existingReview) {
      this.logger.warn(`User ${userId} already reviewed book ${createReviewDto.bookId}`);
      throw new ForbiddenException('You have already reviewed this book');
    }
    
    const review = this.reviewsRepository.create({
      ...createReviewDto,
      userId,
    });
    
    return this.reviewsRepository.save(review);
  }

  /**
   * Find all reviews with optional pagination
   * @param skip - Number of items to skip
   * @param take - Number of items to take
   * @returns Array of review entities
   */
  async findAll(skip = 0, take = 10): Promise<{ reviews: Review[]; total: number }> {
    this.logger.log(`Finding all reviews with pagination: skip=${skip}, take=${take}`);
    
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      skip,
      take,
      relations: ['user', 'book'],
      order: { createdAt: 'DESC' },
    });
    
    return { reviews, total };
  }

  /**
   * Find reviews by book ID
   * @param bookId - Book ID
   * @param skip - Number of items to skip
   * @param take - Number of items to take
   * @returns Array of review entities for the specified book
   */
  async findByBookId(bookId: string, skip = 0, take = 10): Promise<{ reviews: Review[]; total: number }> {
    this.logger.log(`Finding reviews for book with ID: ${bookId}`);
    
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { bookId },
      skip,
      take,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    
    return { reviews, total };
  }

  /**
   * Find reviews by user ID
   * @param userId - User ID
   * @param skip - Number of items to skip
   * @param take - Number of items to take
   * @returns Array of review entities by the specified user
   */
  async findByUserId(userId: string, skip = 0, take = 10): Promise<{ reviews: Review[]; total: number }> {
    this.logger.log(`Finding reviews by user with ID: ${userId}`);
    
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { userId },
      skip,
      take,
      relations: ['book'],
      order: { createdAt: 'DESC' },
    });
    
    return { reviews, total };
  }

  /**
   * Find a review by ID
   * @param id - Review ID
   * @returns Review entity if found
   * @throws NotFoundException if review not found
   */
  async findOne(id: string): Promise<Review> {
    this.logger.log(`Finding review with ID: ${id}`);
    
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });
    
    if (!review) {
      this.logger.warn(`Review with ID ${id} not found`);
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    
    return review;
  }

  /**
   * Update a review
   * @param id - Review ID
   * @param userId - ID of the user updating the review
   * @param updateReviewDto - Review update data
   * @returns Updated review entity
   * @throws NotFoundException if review not found
   * @throws ForbiddenException if user is not the author of the review
   */
  async update(id: string, userId: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    this.logger.log(`Updating review with ID: ${id} by user ${userId}`);
    
    const review = await this.findOne(id);
    
    // Check if the user is the author of the review
    if (review.userId !== userId) {
      this.logger.warn(`User ${userId} attempted to update review ${id} created by user ${review.userId}`);
      throw new ForbiddenException('You can only update your own reviews');
    }
    
    Object.assign(review, updateReviewDto);
    
    return this.reviewsRepository.save(review);
  }

  /**
   * Remove a review
   * @param id - Review ID
   * @param userId - ID of the user removing the review
   * @returns Void
   * @throws NotFoundException if review not found
   * @throws ForbiddenException if user is not the author of the review
   */
  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`Removing review with ID: ${id} by user ${userId}`);
    
    const review = await this.findOne(id);
    
    // Check if the user is the author of the review
    if (review.userId !== userId) {
      this.logger.warn(`User ${userId} attempted to delete review ${id} created by user ${review.userId}`);
      throw new ForbiddenException('You can only delete your own reviews');
    }
    
    await this.reviewsRepository.remove(review);
  }

  /**
   * Calculate average rating for a book
   * @param bookId - Book ID
   * @returns Average rating
   */
  async getAverageRating(bookId: string): Promise<number> {
    this.logger.log(`Calculating average rating for book with ID: ${bookId}`);
    
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .where('review.bookId = :bookId', { bookId })
      .getRawOne();
    
    return result.averageRating ? parseFloat(result.averageRating) : 0;
  }
}
