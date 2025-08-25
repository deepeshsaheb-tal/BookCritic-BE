import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RecommendationsService } from './recommendations.service';
import { Book } from '../books/entities/book.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { BookGenre } from '../books/entities/book-genre.entity';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let booksRepository: Repository<Book>;
  let reviewsRepository: Repository<Review>;
  let usersRepository: Repository<User>;
  let loggerSpy: jest.SpyInstance;

  const mockBookGenre: Partial<BookGenre> = {
    bookId: '123e4567-e89b-12d3-a456-426614174000',
    genreId: '123e4567-e89b-12d3-a456-426614174001',
    genre: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Fiction',
      description: 'Fiction genre',
      createdAt: new Date(),
      updatedAt: new Date(),
      bookGenres: [],
    },
  };

  const mockBook: Partial<Book> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Book',
    author: 'Test Author',
    isbn: '1234567890123',
    description: 'Test description',
    coverImageUrl: 'http://example.com/cover.jpg',
    publishedDate: new Date('2023-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    bookGenres: [mockBookGenre as BookGenre],
    reviews: [],
    favoritedBy: [], // Adding favoritedBy property for the Book entity
  };

  const mockReview: Partial<Review> = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    bookId: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174003',
    rating: 4,
    content: 'Great book!',
    createdAt: new Date(),
    updatedAt: new Date(),
    book: mockBook as Book,
    user: {
      id: '123e4567-e89b-12d3-a456-426614174003',
      email: 'user@example.com',
      displayName: 'Test User',
      passwordHash: 'hashed_password',
      role: 'user',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: [],
      favorites: [], // Adding favorites property for the User entity
    } as User,
  };

  const mockBooks = [
    {
      ...mockBook,
      title: 'Test Book', // Ensure required properties are explicitly set
      author: 'Test Author',
    } as Book,
    {
      ...mockBook,
      id: '223e4567-e89b-12d3-a456-426614174001',
      title: 'Another Test Book',
      author: 'Test Author',
    } as Book,
  ];

  // Mock the query builder with proper typing
  const createQueryBuilderMock = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(mockBooks),
  } as unknown as SelectQueryBuilder<Book>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: getRepositoryToken(Book),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
          },
        },
        {
          provide: getRepositoryToken(Review),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    booksRepository = module.get<Repository<Book>>(getRepositoryToken(Book));
    reviewsRepository = module.get<Repository<Review>>(getRepositoryToken(Review));
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    
    // Setup logger spy
    loggerSpy = jest.spyOn((service as any).logger, 'log');
    jest.spyOn((service as any).logger, 'warn');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecommendationsForUser', () => {
    it('should return popular books when user has no reviews', async () => {
      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce([] as Review[]);
      jest.spyOn(service, 'getPopularBooks').mockResolvedValueOnce(mockBooks);

      const result = await service.getRecommendationsForUser('123e4567-e89b-12d3-a456-426614174003', 10);

      expect(reviewsRepository.find).toHaveBeenCalledWith({
        where: { userId: '123e4567-e89b-12d3-a456-426614174003' },
        relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
      });
      expect(service.getPopularBooks).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockBooks);
      
      // Verify logger calls
      expect(loggerSpy).toHaveBeenCalledWith('Getting recommendations for user 123e4567-e89b-12d3-a456-426614174003');
      expect(loggerSpy).toHaveBeenCalledWith('User 123e4567-e89b-12d3-a456-426614174003 has no reviews, returning popular books');
    });
    
    it('should use default limit when no limit is provided', async () => {
      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce([] as Review[]);
      jest.spyOn(service, 'getPopularBooks').mockResolvedValueOnce(mockBooks);

      const result = await service.getRecommendationsForUser('123e4567-e89b-12d3-a456-426614174003');

      expect(reviewsRepository.find).toHaveBeenCalledWith({
        where: { userId: '123e4567-e89b-12d3-a456-426614174003' },
        relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
      });
      expect(service.getPopularBooks).toHaveBeenCalledWith(10); // Default limit is 10
      expect(result).toEqual(mockBooks);
    });

    it('should return genre-based recommendations when user has reviews', async () => {
      const mockReviews = [
        {
          ...mockReview,
          rating: 5,
          book: {
            ...mockBook,
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction', description: 'Fiction genre' },
              },
            ],
          },
        },
      ];

      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce(mockReviews as unknown as Review[]);
      jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilderMock);

      const result = await service.getRecommendationsForUser('123e4567-e89b-12d3-a456-426614174003', 10);

      expect(reviewsRepository.find).toHaveBeenCalledWith({
        where: { userId: '123e4567-e89b-12d3-a456-426614174003' },
        relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
      });
      expect(booksRepository.createQueryBuilder).toHaveBeenCalled();
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
        'bookGenre.genreId IN (:...genreIds)',
        { genreIds: ['123e4567-e89b-12d3-a456-426614174001'] }
      );
      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'book.id NOT IN (:...reviewedBookIds)',
        { reviewedBookIds: ['123e4567-e89b-12d3-a456-426614174000'] }
      );
      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockBooks);
    });

    it('should supplement with popular books if not enough genre-based recommendations', async () => {
      const mockReviews = [
        {
          ...mockReview,
          rating: 5,
          book: {
            ...mockBook,
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction', description: 'Fiction genre' },
                book: mockBook,
              } as BookGenre,
            ],
          } as Book,
        } as Review,
      ];

      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce(mockReviews as unknown as Review[]);
      const modifiedQueryBuilder = {
        ...createQueryBuilderMock,
        getMany: jest.fn().mockResolvedValueOnce([mockBooks[0]]), // Only one recommendation from genres
      } as unknown as SelectQueryBuilder<Book>;
      
      jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValueOnce(modifiedQueryBuilder);
      jest.spyOn(service, 'getPopularBooks').mockResolvedValueOnce([mockBooks[1]]); // One more from popular

      const result = await service.getRecommendationsForUser('123e4567-e89b-12d3-a456-426614174003', 10);

      expect(service.getPopularBooks).toHaveBeenCalledWith(9, [mockBook.id]);
      expect(result).toEqual([mockBooks[0], mockBooks[1]]);
    });
    
    it('should not supplement with popular books if enough genre-based recommendations', async () => {
      const mockReviews = [
        {
          ...mockReview,
          rating: 5,
          book: {
            ...mockBook,
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction', description: 'Fiction genre' },
                book: mockBook,
              } as BookGenre,
            ],
          } as Book,
        } as Review,
      ];

      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce(mockReviews as unknown as Review[]);
      
      // Mock that we get enough recommendations from genres
      jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilderMock);
      const getPopularBooksSpy = jest.spyOn(service, 'getPopularBooks');

      await service.getRecommendationsForUser('123e4567-e89b-12d3-a456-426614174003', 2);

      // getPopularBooks should not be called since we have enough recommendations
      expect(getPopularBooksSpy).not.toHaveBeenCalled();
    });
    
    it('should handle case where user has reviews but no preferred genres', async () => {
      const mockReviews = [
        {
          ...mockReview,
          rating: 3, // Not highly rated
          book: {
            ...mockBook,
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction', description: 'Fiction genre' },
                book: mockBook,
              } as BookGenre,
            ],
          } as Book,
        } as Review,
      ];

      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce(mockReviews as unknown as Review[]);
      jest.spyOn(service, 'getPopularBooks').mockResolvedValueOnce(mockBooks);
      
      // Mock extractPreferredGenres to return empty array
      jest.spyOn(service as any, 'extractPreferredGenres').mockReturnValueOnce([]);

      // Create a new query builder mock that returns empty array
      const emptyQueryBuilder = {
        ...createQueryBuilderMock,
        getMany: jest.fn().mockResolvedValueOnce([]), // No recommendations from genres
      } as unknown as SelectQueryBuilder<Book>;
      
      jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValueOnce(emptyQueryBuilder);

      const result = await service.getRecommendationsForUser('123e4567-e89b-12d3-a456-426614174003', 6);

      // Should fall back to popular books when no preferred genres
      expect(service.getPopularBooks).toHaveBeenCalledWith(6, [mockBook.id]);
      expect(result).toEqual(mockBooks);
    });
  });

  describe('getPopularBooks', () => {
    it('should return popular books with default limit', async () => {
      jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilderMock);

      const result = await service.getPopularBooks();

      expect(booksRepository.createQueryBuilder).toHaveBeenCalled();
      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockBooks);
      
      // Verify logger calls
      expect(loggerSpy).toHaveBeenCalledWith('Getting popular books');
    });
    
    it('should handle empty excludeBookIds array', async () => {
      // Reset all mocks before this test
      jest.clearAllMocks();
      
      // Create a fresh mock for this test
      const freshQueryBuilderMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBooks),
      } as unknown as SelectQueryBuilder<Book>;
      
      const queryBuilderSpy = jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(freshQueryBuilderMock);
      const andWhereSpy = jest.spyOn(freshQueryBuilderMock, 'andWhere');

      await service.getPopularBooks(10, []);

      expect(queryBuilderSpy).toHaveBeenCalled();
      expect(andWhereSpy).not.toHaveBeenCalled(); // andWhere should not be called with empty array
    });

    it('should return popular books with specified limit', async () => {
      jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilderMock);

      const result = await service.getPopularBooks(5);

      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockBooks);
    });

    it('should exclude specified book IDs', async () => {
      jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilderMock);

      const excludeBookIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const result = await service.getPopularBooks(10, excludeBookIds);

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'book.id NOT IN (:...excludeBookIds)',
        { excludeBookIds }
      );
      expect(result).toEqual(mockBooks);
    });
  });

  describe('getSimilarBooks', () => {
    it('should return similar books based on genres', async () => {
      jest.spyOn(booksRepository, 'findOne').mockResolvedValueOnce(mockBook as Book);
      jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilderMock);

      const result = await service.getSimilarBooks('123e4567-e89b-12d3-a456-426614174000');

      expect(booksRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        relations: ['bookGenres'],
      });
      expect(booksRepository.createQueryBuilder).toHaveBeenCalled();
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
        'bookGenre.genreId IN (:...genreIds)',
        { genreIds: ['123e4567-e89b-12d3-a456-426614174001'] }
      );
      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'book.id != :bookId',
        { bookId: '123e4567-e89b-12d3-a456-426614174000' }
      );
      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockBooks);
      
      // Verify logger calls
      expect(loggerSpy).toHaveBeenCalledWith('Getting similar books for book 123e4567-e89b-12d3-a456-426614174000');
    });
    
    it('should use custom limit when provided', async () => {
      jest.spyOn(booksRepository, 'findOne').mockResolvedValueOnce(mockBook as Book);
      jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilderMock);

      await service.getSimilarBooks('123e4567-e89b-12d3-a456-426614174000', 10);

      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(10);
    });
    
    it('should handle book with no genres', async () => {
      const bookWithNoGenres = {
        ...mockBook,
        bookGenres: [],
      } as Book;
      
      jest.spyOn(booksRepository, 'findOne').mockResolvedValueOnce(bookWithNoGenres);
      const createQueryBuilderSpy = jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilderMock);

      const result = await service.getSimilarBooks('123e4567-e89b-12d3-a456-426614174000');

      expect(createQueryBuilderSpy).toHaveBeenCalled();
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
        'bookGenre.genreId IN (:...genreIds)',
        { genreIds: [] }
      );
      expect(result).toEqual(mockBooks);
    });

    it('should return empty array if book not found', async () => {
      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      jest.spyOn(booksRepository, 'findOne').mockResolvedValueOnce(null);

      const result = await service.getSimilarBooks('non-existent-id');

      expect(booksRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        relations: ['bookGenres'],
      });
      expect(booksRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toEqual([]);
      
      // Verify warning logger call
      expect(warnSpy).toHaveBeenCalledWith('Book non-existent-id not found');
    });
  });

  describe('extractPreferredGenres', () => {
    it('should extract genre IDs from highly rated reviews', () => {
      const mockReviews = [
        {
          ...mockReview,
          rating: 5, // Highly rated
          book: {
            ...mockBook,
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction', description: 'Fiction genre' },
                book: mockBook,
              } as BookGenre,
            ],
          } as Book,
        } as Review,
        {
          ...mockReview,
          id: '223e4567-e89b-12d3-a456-426614174002',
          rating: 3, // Not highly rated, should be ignored
          book: {
            ...mockBook,
            id: '223e4567-e89b-12d3-a456-426614174001',
            bookGenres: [
              {
                bookId: '223e4567-e89b-12d3-a456-426614174001',
                genreId: '223e4567-e89b-12d3-a456-426614174002',
                genre: { id: '223e4567-e89b-12d3-a456-426614174002', name: 'Mystery', description: 'Mystery genre' },
                book: { ...mockBook, id: '223e4567-e89b-12d3-a456-426614174001' },
              } as BookGenre,
            ],
          } as Book,
        } as Review,
        {
          ...mockReview,
          id: '323e4567-e89b-12d3-a456-426614174003',
          rating: 4, // Highly rated
          book: {
            ...mockBook,
            id: '323e4567-e89b-12d3-a456-426614174002',
            bookGenres: [
              {
                bookId: '323e4567-e89b-12d3-a456-426614174002',
                genreId: '323e4567-e89b-12d3-a456-426614174003',
                genre: { id: '323e4567-e89b-12d3-a456-426614174003', name: 'Sci-Fi', description: 'Sci-Fi genre' },
                book: { ...mockBook, id: '323e4567-e89b-12d3-a456-426614174002' },
              } as BookGenre,
            ],
          } as Book,
        } as Review,
      ];

      // Use private method via any type cast
      const result = (service as any).extractPreferredGenres(mockReviews);

      // Should only include genres from books rated 4 or higher
      expect(result).toEqual(['123e4567-e89b-12d3-a456-426614174001', '323e4567-e89b-12d3-a456-426614174003']);
      expect(result).not.toContain('223e4567-e89b-12d3-a456-426614174002');
    });
    
    it('should handle reviews with exactly rating 4', () => {
      const mockReviews = [
        {
          ...mockReview,
          rating: 4, // Exactly 4
          book: {
            ...mockBook,
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction', description: 'Fiction genre' },
                book: mockBook,
              } as BookGenre,
            ],
          } as Book,
        } as Review,
      ];

      const result = (service as any).extractPreferredGenres(mockReviews);
      expect(result).toEqual(['123e4567-e89b-12d3-a456-426614174001']);
    });
    
    it('should handle reviews with rating below 4', () => {
      const mockReviews = [
        {
          ...mockReview,
          rating: 3, // Below 4
          book: {
            ...mockBook,
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction', description: 'Fiction genre' },
                book: mockBook,
              } as BookGenre,
            ],
          } as Book,
        } as Review,
      ];

      const result = (service as any).extractPreferredGenres(mockReviews);
      expect(result).toEqual([]);
    });
    
    it('should handle reviews with missing book data', () => {
      const mockReviews = [
        {
          ...mockReview,
          rating: 5,
          book: null, // Missing book
        } as Review,
        {
          ...mockReview,
          id: '223e4567-e89b-12d3-a456-426614174002',
          rating: 5,
          book: undefined, // Undefined book
        } as unknown as Review,
        {
          ...mockReview,
          id: '323e4567-e89b-12d3-a456-426614174003',
          rating: 5,
          book: {
            ...mockBook,
            id: '323e4567-e89b-12d3-a456-426614174002',
            bookGenres: null, // Missing bookGenres
          } as Book,
        } as Review,
      ];

      const result = (service as any).extractPreferredGenres(mockReviews);

      // Should return empty array when no valid genres found
      expect(result).toEqual([]);
    });
    
    it('should handle empty reviews array', () => {
      const result = (service as any).extractPreferredGenres([]);
      expect(result).toEqual([]);
    });
    
    it('should handle reviews with empty bookGenres array', () => {
      const mockReviews = [
        {
          ...mockReview,
          rating: 5,
          book: {
            ...mockBook,
            bookGenres: [], // Empty bookGenres array
          } as Book,
        } as Review,
      ];

      const result = (service as any).extractPreferredGenres(mockReviews);
      expect(result).toEqual([]);
    });
  });
});
