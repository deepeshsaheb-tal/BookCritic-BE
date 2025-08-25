import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookGenre } from './entities/book-genre.entity';
import { Review } from '../reviews/entities/review.entity';

/**
 * Service for managing book operations
 */
@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectRepository(BookGenre)
    private readonly bookGenresRepository: Repository<BookGenre>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  /**
   * Create a new book
   * @param createBookDto - Book creation data
   * @returns The created book entity
   */
  async create(createBookDto: CreateBookDto): Promise<Book> {
    const { genreIds, ...bookData } = createBookDto;
    
    this.logger.log(`Creating new book: ${bookData.title}`);
    
    // Create the book entity
    const book = this.booksRepository.create(bookData);
    const savedBook = await this.booksRepository.save(book);
    
    // Associate genres if provided
    if (genreIds && genreIds.length > 0) {
      await this.updateBookGenres(savedBook.id, genreIds);
    }
    
    return this.findOne(savedBook.id);
  }

  /**
   * Find all books with optional pagination
   * @param skip - Number of items to skip
   * @param take - Number of items to take
   * @returns Array of book entities
   */
  async findAll(skip = 0, take = 10): Promise<{ books: Book[]; total: number }> {
    this.logger.log(`Finding all books with pagination: skip=${skip}, take=${take}`);
    
    const [books, total] = await this.booksRepository.findAndCount({
      skip,
      take,
      relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
    });
    
    return { books, total };
  }

  /**
   * Find a book by ID
   * @param id - Book ID
   * @returns Book entity if found
   * @throws NotFoundException if book not found
   */
  async findOne(id: string): Promise<Book> {
    this.logger.log(`Finding book with ID: ${id}`);
    
    const book = await this.booksRepository.findOne({
      where: { id },
      relations: ['bookGenres', 'bookGenres.genre', 'reviews', 'reviews.user'],
    });
    
    if (!book) {
      this.logger.warn(`Book with ID ${id} not found`);
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    
    return book;
  }

  /**
   * Search for books by title, author, or ISBN
   * @param query - Search query
   * @param skip - Number of items to skip
   * @param take - Number of items to take
   * @returns Array of matching book entities
   */
  async search(query: string, skip = 0, take = 10): Promise<{ books: Book[]; total: number }> {
    this.logger.log(`Searching books with query: ${query}`);
    
    const [books, total] = await this.booksRepository
      .createQueryBuilder('book')
      .where('book.title ILIKE :query', { query: `%${query}%` })
      .orWhere('book.author ILIKE :query', { query: `%${query}%` })
      .orWhere('book.isbn = :isbn', { isbn: query })
      .leftJoinAndSelect('book.bookGenres', 'bookGenres')
      .leftJoinAndSelect('bookGenres.genre', 'genre')
      .leftJoinAndSelect('book.reviews', 'reviews')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    
    return { books, total };
  }

  /**
   * Update a book
   * @param id - Book ID
   * @param updateBookDto - Book update data
   * @returns Updated book entity
   * @throws NotFoundException if book not found
   */
  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    this.logger.log(`Updating book with ID: ${id}`);
    
    const { genreIds, ...bookData } = updateBookDto;
    const book = await this.findOne(id);
    
    // Update book data
    Object.assign(book, bookData);
    await this.booksRepository.save(book);
    
    // Update genres if provided
    if (genreIds) {
      await this.updateBookGenres(id, genreIds);
    }
    
    return this.findOne(id);
  }

  /**
   * Remove a book
   * @param id - Book ID
   * @returns Void
   * @throws NotFoundException if book not found
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removing book with ID: ${id}`);
    
    const book = await this.findOne(id);
    
    // Remove book-genre associations
    await this.bookGenresRepository.delete({ bookId: id });
    
    // Remove the book
    await this.booksRepository.remove(book);
  }

  /**
   * Update book-genre associations
   * @param bookId - Book ID
   * @param genreIds - Array of genre IDs
   * @returns Void
   */
  private async updateBookGenres(bookId: string, genreIds: string[]): Promise<void> {
    this.logger.log(`Updating genres for book with ID: ${bookId}`);
    
    // Remove existing associations
    await this.bookGenresRepository.delete({ bookId });
    
    // Create new associations
    const bookGenres = genreIds.map(genreId => 
      this.bookGenresRepository.create({ bookId, genreId })
    );
    
    await this.bookGenresRepository.save(bookGenres);
  }
  
  /**
   * Calculate average rating and total reviews for a book
   * @param bookId - Book ID
   * @returns Object containing average rating and total reviews
   */
  async calculateBookRatingStats(bookId: string): Promise<{ averageRating: number; totalReviews: number }> {
    this.logger.log(`Calculating rating stats for book with ID: ${bookId}`);
    
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.bookId = :bookId', { bookId })
      .getRawOne();
    
    return {
      averageRating: result.averageRating ? parseFloat(parseFloat(result.averageRating).toFixed(1)) : 0,
      totalReviews: result.totalReviews ? parseInt(result.totalReviews) : 0
    };
  }
}
