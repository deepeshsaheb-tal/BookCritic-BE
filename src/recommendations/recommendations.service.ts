import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/entities/book.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { Genre } from '../genres/entities/genre.entity';

/**
 * Service for book recommendation functionality
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Get book recommendations for a user based on their reading history and preferences
   * @param userId - User ID to get recommendations for
   * @param limit - Maximum number of recommendations to return
   * @returns Array of recommended books
   */
  async getRecommendationsForUser(userId: string, limit = 10): Promise<Book[]> {
    this.logger.log(`Getting recommendations for user ${userId}`);

    // Get the user's reviews to understand their preferences
    const userReviews = await this.reviewsRepository.find({
      where: { userId },
      relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
    });

    if (userReviews.length === 0) {
      this.logger.log(`User ${userId} has no reviews, returning popular books`);
      return this.getPopularBooks(limit);
    }

    // Extract genres the user has shown interest in (from books they rated highly)
    const preferredGenreIds = this.extractPreferredGenres(userReviews);
    
    // Get books the user has already reviewed (to exclude from recommendations)
    const reviewedBookIds = userReviews.map(review => review.bookId);

    // Find books in the user's preferred genres that they haven't reviewed yet
    const recommendedBooks = await this.booksRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.bookGenres', 'bookGenre')
      .leftJoinAndSelect('bookGenre.genre', 'genre')
      .leftJoinAndSelect('book.reviews', 'review')
      .where('bookGenre.genreId IN (:...genreIds)', { genreIds: preferredGenreIds })
      .andWhere('book.id NOT IN (:...reviewedBookIds)', { reviewedBookIds })
      .orderBy('book.averageRating', 'DESC')
      .take(limit)
      .getMany();

    // If we don't have enough recommendations, supplement with popular books
    if (recommendedBooks.length < limit) {
      const additionalBooks = await this.getPopularBooks(limit - recommendedBooks.length, reviewedBookIds);
      recommendedBooks.push(...additionalBooks);
    }

    return recommendedBooks;
  }

  /**
   * Get popular books based on average rating and number of reviews
   * @param limit - Maximum number of books to return
   * @param excludeBookIds - Array of book IDs to exclude
   * @returns Array of popular books
   */
  async getPopularBooks(limit = 10, excludeBookIds: string[] = []): Promise<Book[]> {
    this.logger.log('Getting popular books');

    const query = this.booksRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.bookGenres', 'bookGenre')
      .leftJoinAndSelect('bookGenre.genre', 'genre')
      .leftJoinAndSelect('book.reviews', 'review')
      .select([
        'book.id',
        'book.title',
        'book.author',
        'book.isbn',
        'book.description',
        'book.publishedDate',
        'book.coverImageUrl',
        'bookGenre',
        'genre',
      ])
      .addSelect('COUNT(review.id)', 'reviewCount')
      .addSelect('AVG(review.rating)', 'averageRating')
      .groupBy('book.id')
      .addGroupBy('bookGenre.bookId')
      .addGroupBy('bookGenre.genreId')
      .addGroupBy('genre.id')
      .orderBy('averageRating', 'DESC')
      .addOrderBy('reviewCount', 'DESC')
      .take(limit);

    if (excludeBookIds.length > 0) {
      query.andWhere('book.id NOT IN (:...excludeBookIds)', { excludeBookIds });
    }

    return query.getMany();
  }

  /**
   * Get book recommendations based on a specific book
   * @param bookId - Book ID to get similar books for
   * @param limit - Maximum number of recommendations to return
   * @returns Array of similar books
   */
  async getSimilarBooks(bookId: string, limit = 5): Promise<Book[]> {
    this.logger.log(`Getting similar books for book ${bookId}`);

    // Get the book's genres
    const book = await this.booksRepository.findOne({
      where: { id: bookId },
      relations: ['bookGenres'],
    });

    if (!book) {
      this.logger.warn(`Book ${bookId} not found`);
      return [];
    }

    const genreIds = book.bookGenres.map(bg => bg.genreId);

    // Find books in the same genres
    const similarBooks = await this.booksRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.bookGenres', 'bookGenre')
      .leftJoinAndSelect('bookGenre.genre', 'genre')
      .leftJoinAndSelect('book.reviews', 'review')
      .where('bookGenre.genreId IN (:...genreIds)', { genreIds })
      .andWhere('book.id != :bookId', { bookId })
      .orderBy('book.averageRating', 'DESC')
      .take(limit)
      .getMany();

    return similarBooks;
  }

  /**
   * Extract preferred genres from user reviews
   * @param reviews - Array of user reviews
   * @returns Array of genre IDs the user prefers
   */
  private extractPreferredGenres(reviews: Review[]): string[] {
    // Consider books with ratings of 4 or 5 as preferred
    const highlyRatedReviews = reviews.filter(review => review.rating >= 4);
    
    // Extract unique genre IDs from the highly rated books
    const genreIds = new Set<string>();
    
    highlyRatedReviews.forEach(review => {
      if (review.book && review.book.bookGenres) {
        review.book.bookGenres.forEach(bookGenre => {
          genreIds.add(bookGenre.genreId);
        });
      }
    });
    
    return Array.from(genreIds);
  }
}
