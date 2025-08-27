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

    try {
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
      // Using a simpler approach with find() instead of query builder
      let recommendedBooks: Book[] = [];
      
      if (preferredGenreIds.length > 0) {
        // Get books with the preferred genres
        const books = await this.booksRepository.find({
          relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
        });
        
        // Filter books manually to avoid complex query issues
        recommendedBooks = books
          .filter(book => {
            // Check if book has any of the preferred genres
            const hasPreferredGenre = book.bookGenres.some(bg => 
              preferredGenreIds.includes(bg.genreId)
            );
            
            // Check if user hasn't reviewed this book
            const notReviewed = !reviewedBookIds.includes(book.id);
            
            return hasPreferredGenre && notReviewed;
          })
          // Sort by average rating (highest first)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          // Limit to requested number
          .slice(0, limit);
      }

      // If we don't have enough recommendations, supplement with popular books
      if (recommendedBooks.length < limit) {
        const additionalBooks = await this.getPopularBooks(
          limit - recommendedBooks.length, 
          [...reviewedBookIds, ...recommendedBooks.map(book => book.id)]
        );
        recommendedBooks.push(...additionalBooks);
      }

      return recommendedBooks;
    } catch (error) {
      this.logger.error(`Error getting recommendations for user ${userId}:`, error);
      // Fallback to popular books if there's an error
      return this.getPopularBooks(limit);
    }
  }

  /**
   * Get popular books based on average rating and number of reviews
   * @param limit - Maximum number of books to return
   * @param excludeBookIds - Array of book IDs to exclude
   * @returns Array of popular books
   */
  async getPopularBooks(limit = 10, excludeBookIds: string[] = []): Promise<Book[]> {
    this.logger.log('Getting popular books');

    try {
      // Use a simpler approach with find() instead of query builder
      const books = await this.booksRepository.find({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });

      // Filter, sort, and limit the books manually
      return books
        .filter(book => !excludeBookIds.includes(book.id))
        // Sort by average rating (highest first)
        .sort((a, b) => {
          // First by average rating
          const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          
          // Then by number of reviews
          return (b.totalReviews || 0) - (a.totalReviews || 0);
        })
        // Limit to requested number
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting popular books:', error);
      return [];
    }
  }

  /**
   * Get book recommendations based on a specific book
   * @param bookId - Book ID to get similar books for
   * @param limit - Maximum number of recommendations to return
   * @returns Array of similar books
   */
  async getSimilarBooks(bookId: string, limit = 5): Promise<Book[]> {
    this.logger.log(`Getting similar books for book ${bookId}`);

    try {
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
      
      if (genreIds.length === 0) {
        this.logger.warn(`Book ${bookId} has no genres`);
        return [];
      }

      // Get all books with their relations
      const allBooks = await this.booksRepository.find({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });
      
      // Filter, sort, and limit the books manually
      return allBooks
        .filter(b => {
          // Exclude the source book
          if (b.id === bookId) return false;
          
          // Check if book has any matching genres
          return b.bookGenres.some(bg => genreIds.includes(bg.genreId));
        })
        // Sort by average rating (highest first)
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        // Limit to requested number
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting similar books for book ${bookId}:`, error);
      return [];
    }
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
