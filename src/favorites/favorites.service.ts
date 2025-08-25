import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavorite } from './entities/user-favorite.entity';
import { BooksService } from '../books/books.service';
import { UsersService } from '../users/users.service';

/**
 * Service for managing user favorites
 */
@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
    private readonly booksService: BooksService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Add a book to user's favorites
   * @param userId - User ID
   * @param bookId - Book ID
   * @returns The created favorite relationship
   */
  async addFavorite(userId: string, bookId: string): Promise<UserFavorite> {
    // Check if user exists
    await this.usersService.findOne(userId);
    
    // Check if book exists
    await this.booksService.findOne(bookId);
    
    // Check if already favorited
    const existingFavorite = await this.userFavoriteRepository.findOne({
      where: { userId, bookId },
    });
    
    if (existingFavorite) {
      throw new ConflictException('Book is already in favorites');
    }
    
    // Create new favorite
    const favorite = this.userFavoriteRepository.create({
      userId,
      bookId,
    });
    
    return this.userFavoriteRepository.save(favorite);
  }

  /**
   * Remove a book from user's favorites
   * @param userId - User ID
   * @param bookId - Book ID
   */
  async removeFavorite(userId: string, bookId: string): Promise<void> {
    const result = await this.userFavoriteRepository.delete({
      userId,
      bookId,
    });
    
    if (result.affected === 0) {
      throw new NotFoundException('Favorite not found');
    }
  }

  /**
   * Check if a book is in user's favorites
   * @param userId - User ID
   * @param bookId - Book ID
   * @returns True if book is in favorites, false otherwise
   */
  async isFavorite(userId: string, bookId: string): Promise<boolean> {
    const count = await this.userFavoriteRepository.count({
      where: { userId, bookId },
    });
    
    return count > 0;
  }

  /**
   * Get all favorite books for a user
   * @param userId - User ID
   * @returns List of favorite books with their details
   */
  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    // Check if user exists
    await this.usersService.findOne(userId);
    
    return this.userFavoriteRepository.find({
      where: { userId },
      relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
    });
  }
}
