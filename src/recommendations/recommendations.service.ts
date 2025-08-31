import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Book } from '../books/entities/book.entity';
import { Review } from '../reviews/entities/review.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { FavoritesService } from '../favorites/favorites.service';
import { OpenAIService } from '../common/services/openai.service';
import { User } from '../users/entities/user.entity';
import { Genre } from '../genres/entities/genre.entity';

/**
 * Service for book recommendations
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
    private readonly favoritesService: FavoritesService,
    private readonly openAIService: OpenAIService,
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

      // Get user's favorites
      const userFavorites = await this.favoritesService.getUserFavorites(userId);

      if (userReviews.length === 0 && userFavorites.length === 0) {
        this.logger.log(`User ${userId} has no reviews or favorites, returning popular books`);
        return this.getTopRatedBooks(limit);
      }

      // Books the user has already interacted with (to exclude from recommendations)
      const reviewedBookIds = userReviews.map(review => review.bookId);
      const favoriteBookIds = userFavorites.map(favorite => favorite.bookId);
      const excludeBookIds = [...new Set([...reviewedBookIds, ...favoriteBookIds])];

      // Get recommendations from different sources
      const [genreBasedBooks, favoriteBasedBooks, topRatedBooks, llmBooks] = await Promise.all([
        // 1. Books based on preferred genres from reviews
        this.getGenreBasedRecommendations(userId, Math.ceil(limit / 2), excludeBookIds),
        // 2. Books similar to user's favorites
        this.getFavoriteBasedRecommendations(userId, Math.ceil(limit / 2), excludeBookIds),
        // 3. Top-rated books
        this.getTopRatedBooks(Math.ceil(limit / 2), excludeBookIds),
        // 4. LLM-based recommendations
        this.getLLMRecommendations(userId, limit, excludeBookIds)
      ]);

      // Combine and deduplicate recommendations
      const allRecommendations = [...llmBooks, ...genreBasedBooks, ...favoriteBasedBooks, ...topRatedBooks];
      const uniqueRecommendations = this.deduplicateBooks(allRecommendations);

      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting recommendations for user ${userId}:`, error);
      // Fallback to top-rated books if there's an error
      return this.getTopRatedBooks(limit);
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

  /**
   * Get top-rated books across the platform
   * @param limit - Maximum number of books to return
   * @param excludeBookIds - Array of book IDs to exclude
   * @returns Array of top-rated books
   */
  async getTopRatedBooks(limit = 10, excludeBookIds: string[] = []): Promise<Book[]> {
    this.logger.log('Getting top-rated books');

    try {
      // Get all books with their relations
      const books = await this.booksRepository.find({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });

      // Filter, sort, and limit the books manually
      return books
        .filter(book => !excludeBookIds.includes(book.id))
        // Filter to only include books with at least 3 reviews and rating >= 4
        .filter(book => (book.totalReviews || 0) >= 3 && (book.averageRating || 0) >= 4)
        // Sort by average rating (highest first)
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        // Limit to requested number
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting top-rated books:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on user's preferred genres from reviews
   * @param userId - User ID to get recommendations for
   * @param limit - Maximum number of recommendations to return
   * @param excludeBookIds - Array of book IDs to exclude
   * @returns Array of recommended books
   */
  async getGenreBasedRecommendations(
    userId: string,
    limit = 10,
    excludeBookIds: string[] = [],
  ): Promise<Book[]> {
    this.logger.log(`Getting genre-based recommendations for user ${userId}`);

    try {
      // Get the user's reviews to understand their preferences
      const userReviews = await this.reviewsRepository.find({
        where: { userId },
        relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
      });

      if (userReviews.length === 0) {
        return [];
      }

      // Extract genres the user has shown interest in (from books they rated highly)
      const preferredGenreIds = this.extractPreferredGenres(userReviews);
      
      if (preferredGenreIds.length === 0) {
        return [];
      }

      // Get books with the preferred genres
      const books = await this.booksRepository.find({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });
      
      // Filter books manually to avoid complex query issues
      return books
        .filter(book => {
          // Exclude books the user has already interacted with
          if (excludeBookIds.includes(book.id)) {
            return false;
          }
          
          // Check if book has any of the preferred genres
          return book.bookGenres.some(bg => preferredGenreIds.includes(bg.genreId));
        })
        // Sort by average rating (highest first)
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        // Limit to requested number
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting genre-based recommendations for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get recommendations based on user's favorite books
   * @param userId - User ID to get recommendations for
   * @param limit - Maximum number of recommendations to return
   * @param excludeBookIds - Array of book IDs to exclude
   * @returns Array of recommended books
   */
  async getFavoriteBasedRecommendations(
    userId: string,
    limit = 10,
    excludeBookIds: string[] = [],
  ): Promise<Book[]> {
    this.logger.log(`Getting favorite-based recommendations for user ${userId}`);

    try {
      // Get user's favorites
      const userFavorites = await this.favoritesService.getUserFavorites(userId);

      if (userFavorites.length === 0) {
        return [];
      }

      // Extract genres from favorite books
      const favoriteGenreIds = new Set<string>();
      const favoriteAuthors = new Set<string>();
      
      userFavorites.forEach(favorite => {
        if (favorite.book) {
          // Add author
          if (favorite.book.author) {
            favoriteAuthors.add(favorite.book.author);
          }
          
          // Add genres
          if (favorite.book.bookGenres) {
            favorite.book.bookGenres.forEach(bg => {
              if (bg.genreId) {
                favoriteGenreIds.add(bg.genreId);
              }
            });
          }
        }
      });

      // Get all books
      const books = await this.booksRepository.find({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });
      
      // Filter and score books
      const scoredBooks = books
        .filter(book => !excludeBookIds.includes(book.id))
        .map(book => {
          let score = 0;
          
          // Score based on matching author
          if (book.author && favoriteAuthors.has(book.author)) {
            score += 5;
          }
          
          // Score based on matching genres
          if (book.bookGenres) {
            book.bookGenres.forEach(bg => {
              if (bg.genreId && favoriteGenreIds.has(bg.genreId)) {
                score += 2;
              }
            });
          }
          
          // Add rating score
          score += (book.averageRating || 0);
          
          return { book, score };
        })
        // Filter out books with no relevance
        .filter(item => item.score > 0)
        // Sort by score (highest first)
        .sort((a, b) => b.score - a.score);
      
      // Return the top books
      return scoredBooks.slice(0, limit).map(item => item.book);
    } catch (error) {
      this.logger.error(`Error getting favorite-based recommendations for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get recommendations using OpenAI's LLM
   * @param userId - User ID to get recommendations for
   * @param limit - Maximum number of recommendations to return
   * @param excludeBookIds - Array of book IDs to exclude
   * @returns Array of recommended books
   */
  async getLLMRecommendations(
    userId: string,
    limit = 10,
    excludeBookIds: string[] = [],
  ): Promise<Book[]> {
    this.logger.log(`Getting LLM-based recommendations for user ${userId}`);

    try {
      // Get user's reviews and favorites
      const [userReviews, userFavorites] = await Promise.all([
        this.reviewsRepository.find({
          where: { userId },
          relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
        }),
        this.favoritesService.getUserFavorites(userId),
      ]);

      if (userReviews.length === 0 && userFavorites.length === 0) {
        this.logger.log(`User ${userId} has no reviews or favorites, skipping LLM recommendations`);
        return [];
      }

      // Extract user preferences
      const favoriteGenres = new Set<string>();
      const favoriteAuthors = new Set<string>();
      const recentlyRead = new Set<string>();
      const highlyRated = new Set<string>();

      // Process reviews
      userReviews.forEach(review => {
        if (review.book) {
          // Add to recently read
          recentlyRead.add(review.book.title);
          
          // Add to highly rated if rating >= 4
          if (review.rating >= 4) {
            highlyRated.add(review.book.title);
            
            // Add author for highly rated books
            if (review.book.author) {
              favoriteAuthors.add(review.book.author);
            }
            
            // Add genres for highly rated books
            if (review.book.bookGenres) {
              review.book.bookGenres.forEach(bg => {
                if (bg.genre && bg.genre.name) {
                  favoriteGenres.add(bg.genre.name);
                }
              });
            }
          }
        }
      });

      // Process favorites
      userFavorites.forEach(favorite => {
        if (favorite.book) {
          // Add to highly rated
          highlyRated.add(favorite.book.title);
          
          // Add author
          if (favorite.book.author) {
            favoriteAuthors.add(favorite.book.author);
          }
          
          // Add genres
          if (favorite.book.bookGenres) {
            favorite.book.bookGenres.forEach(bg => {
              if (bg.genre && bg.genre.name) {
                favoriteGenres.add(bg.genre.name);
              }
            });
          }
        }
      });

      // Get all available books (excluding ones the user has already interacted with)
      const availableBooks = await this.booksRepository.find({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });
      
      const filteredBooks = availableBooks.filter(book => !excludeBookIds.includes(book.id));

      // Prepare user preferences for OpenAI
      const userPreferences = {
        favoriteGenres: Array.from(favoriteGenres),
        favoriteAuthors: Array.from(favoriteAuthors),
        recentlyRead: Array.from(recentlyRead),
        highlyRated: Array.from(highlyRated),
      };

      // Get recommendations from OpenAI
      return this.openAIService.getBookRecommendations(userPreferences, filteredBooks, limit);
    } catch (error) {
      this.logger.error(`Error getting LLM-based recommendations for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Deduplicate books by ID
   * @param books - Array of books to deduplicate
   * @returns Deduplicated array of books
   */
  private deduplicateBooks(books: Book[]): Book[] {
    const uniqueBooks = new Map<string, Book>();
    
    books.forEach(book => {
      if (!uniqueBooks.has(book.id)) {
        uniqueBooks.set(book.id, book);
      }
    });
    
    return Array.from(uniqueBooks.values());
  }
}
