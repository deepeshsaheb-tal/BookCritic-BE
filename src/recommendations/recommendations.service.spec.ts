import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RecommendationsService } from './recommendations.service';
import { Book } from '../books/entities/book.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { BookGenre } from '../books/entities/book-genre.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { FavoritesService } from '../favorites/favorites.service';
import { OpenAIService } from '../common/services/openai.service';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let booksRepository: Repository<Book>;
  let reviewsRepository: Repository<Review>;
  let usersRepository: Repository<User>;
  let userFavoriteRepository: Repository<UserFavorite>;
  let favoritesService: FavoritesService;
  let openAIService: OpenAIService;
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
      averageRating: 4.5,
      totalReviews: 10,
    } as Book,
    {
      ...mockBook,
      id: '223e4567-e89b-12d3-a456-426614174001',
      title: 'Another Test Book',
      author: 'Test Author',
      averageRating: 4.0,
      totalReviews: 5,
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

  // Mock repositories and services
  const mockBooksRepository = {
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue(mockBooks),
    createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
  };

  const mockReviewsRepository = {
    find: jest.fn(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
  };

  const mockUserFavoriteRepository = {
    find: jest.fn(),
  };

  const mockFavoritesService = {
    getUserFavorites: jest.fn(),
  };

  const mockOpenAIService = {
    getBookRecommendations: jest.fn().mockImplementation((userPreferences, filteredBooks, limit) => {
      return Promise.resolve([mockBook] as Book[]);
    }),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Reset query builder mock methods
    Object.values(createQueryBuilderMock).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockClear();
      }
    });
    
    // Ensure getMany returns mockBooks by recreating the mock function
    (createQueryBuilderMock.getMany as jest.Mock).mockResolvedValue(mockBooks);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: getRepositoryToken(Book),
          useValue: mockBooksRepository,
        },
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(UserFavorite),
          useValue: mockUserFavoriteRepository,
        },
        {
          provide: FavoritesService,
          useValue: mockFavoritesService,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    booksRepository = module.get<Repository<Book>>(getRepositoryToken(Book));
    reviewsRepository = module.get<Repository<Review>>(getRepositoryToken(Review));
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userFavoriteRepository = module.get<Repository<UserFavorite>>(getRepositoryToken(UserFavorite));
    favoritesService = module.get<FavoritesService>(FavoritesService);
    openAIService = module.get<OpenAIService>(OpenAIService);
    
    // Setup logger spy
    loggerSpy = jest.spyOn((service as any).logger, 'log');
    jest.spyOn((service as any).logger, 'warn');
    jest.spyOn((service as any).logger, 'error');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecommendationsForUser', () => {
    it('should return popular books when user has no reviews', async () => {
      // Mock the reviewsRepository.find to return empty array
      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce([]);
      
      // Mock the favoritesService.getUserFavorites to return empty array
      jest.spyOn(favoritesService, 'getUserFavorites').mockResolvedValueOnce([]);
      
      // Mock the getTopRatedBooks method to return mockBooks
      jest.spyOn(service, 'getTopRatedBooks').mockResolvedValueOnce(mockBooks);

      const result = await service.getRecommendationsForUser('123e4567-e89b-12d3-a456-426614174003', 10);

      expect(reviewsRepository.find).toHaveBeenCalledWith({
        where: { userId: '123e4567-e89b-12d3-a456-426614174003' },
        relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
      });
      expect(favoritesService.getUserFavorites).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174003');
      expect(service.getTopRatedBooks).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockBooks);
      
      // Verify logger calls
      expect(loggerSpy).toHaveBeenCalledWith('Getting recommendations for user 123e4567-e89b-12d3-a456-426614174003');
      expect(loggerSpy).toHaveBeenCalledWith('User 123e4567-e89b-12d3-a456-426614174003 has no reviews or favorites, returning popular books');
    });
    
    it('should use default limit when no limit is provided', async () => {
      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce([]);
      jest.spyOn(favoritesService, 'getUserFavorites').mockResolvedValueOnce([]);
      jest.spyOn(service, 'getTopRatedBooks').mockResolvedValueOnce(mockBooks);

      const result = await service.getRecommendationsForUser('123e4567-e89b-12d3-a456-426614174003');

      expect(reviewsRepository.find).toHaveBeenCalledWith({
        where: { userId: '123e4567-e89b-12d3-a456-426614174003' },
        relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
      });
      
      expect(service.getTopRatedBooks).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockBooks);
    });

    it('should supplement with popular books if not enough genre-based recommendations', async () => {
      // Create local book and review objects for this test
      const localMockBook: Partial<Book> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890123',
        description: 'Test description',
        coverImageUrl: 'http://example.com/cover.jpg',
        publishedDate: new Date('2023-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        bookGenres: [],
        reviews: [],
        favoritedBy: [],
      };
      
      const localMockReview: Partial<Review> = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        bookId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174003',
        rating: 4,
        content: 'Great book!',
        createdAt: new Date(),
        updatedAt: new Date(),
        book: localMockBook as Book,
      };
      
      // Create local mockBooks array
      const localMockBooks = [
        {
          ...localMockBook,
          title: 'Test Book 1',
        } as Book,
        {
          ...localMockBook,
          id: '223e4567-e89b-12d3-a456-426614174001',
          title: 'Test Book 2',
        } as Book,
      ];
      
      const mockReviews = [
        {
          ...localMockReview,
          rating: 5,
          book: {
            ...localMockBook,
            bookGenres: [
              {
                bookId: localMockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction', description: 'Fiction genre' },
                book: localMockBook,
              } as BookGenre,
            ],
          } as Book,
        } as Review,
      ];

      // Mock reviewsRepository.find to return mockReviews
      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce(mockReviews);
      
      // Mock favoritesService.getUserFavorites to return empty array
      jest.spyOn(favoritesService, 'getUserFavorites').mockResolvedValueOnce([]);
      
      // Mock the individual recommendation methods
      jest.spyOn(service, 'getGenreBasedRecommendations').mockResolvedValueOnce([localMockBooks[0]]);
      jest.spyOn(service, 'getFavoriteBasedRecommendations').mockResolvedValueOnce([]);
      jest.spyOn(service, 'getTopRatedBooks').mockResolvedValueOnce([localMockBooks[1]]);
      jest.spyOn(service, 'getLLMRecommendations').mockResolvedValueOnce([]);
      
      // Mock the deduplicateBooks method to return the combined books
      jest.spyOn(service as any, 'deduplicateBooks').mockReturnValueOnce([localMockBooks[0], localMockBooks[1]]);

      const result = await service.getRecommendationsForUser('123e4567-e89b-12d3-a456-426614174003', 10);

      // Verify that all recommendation methods were called with correct parameters
      expect(service.getGenreBasedRecommendations).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174003',
        5, // Half of the limit
        expect.any(Array),
      );
      
      expect(service.getFavoriteBasedRecommendations).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174003',
        5, // Half of the limit
        expect.any(Array),
      );
      
      expect(service.getTopRatedBooks).toHaveBeenCalledWith(
        5, // Remaining limit after genre-based recommendations
        expect.any(Array),
      );
      
      expect(result).toHaveLength(2);
      expect(result).toEqual([localMockBooks[0], localMockBooks[1]]);
    });
  });

  describe('getTopRatedBooks', () => {
    it('should return top-rated books', async () => {
      // Mock the booksRepository.find to return mockBooks
      jest.spyOn(booksRepository, 'find').mockResolvedValueOnce(mockBooks);

      const result = await service.getTopRatedBooks(5);

      expect(booksRepository.find).toHaveBeenCalledWith({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });
      expect(result).toHaveLength(2);
    });

    it('should filter out books with excludeBookIds', async () => {
      // Mock the booksRepository.find to return mockBooks
      jest.spyOn(booksRepository, 'find').mockResolvedValueOnce(mockBooks);

      const result = await service.getTopRatedBooks(5, [mockBooks[0].id]);

      expect(booksRepository.find).toHaveBeenCalledWith({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockBooks[1].id);
    });

    it('should handle errors gracefully', async () => {
      // Mock the booksRepository.find to throw an error
      jest.spyOn(booksRepository, 'find').mockRejectedValueOnce(new Error('Test error'));
      
      const errorSpy = jest.spyOn((service as any).logger, 'error');

      const result = await service.getTopRatedBooks(5);

      expect(errorSpy).toHaveBeenCalledWith('Error getting top-rated books:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('getGenreBasedRecommendations', () => {
    it('should return books based on user preferred genres', async () => {
      // Create mock reviews with genre information
      const mockReviewsWithGenres = [
        {
          ...mockReview,
          book: {
            ...mockBook,
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction' },
              } as BookGenre,
            ],
          } as Book,
        } as Review,
      ];

      // Mock reviewsRepository.find to return mockReviewsWithGenres
      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce(mockReviewsWithGenres);
      
      // Mock booksRepository.find to return mockBooks
      jest.spyOn(booksRepository, 'find').mockResolvedValueOnce(mockBooks);

      const result = await service.getGenreBasedRecommendations('123e4567-e89b-12d3-a456-426614174003', 5);

      expect(reviewsRepository.find).toHaveBeenCalledWith({
        where: { userId: '123e4567-e89b-12d3-a456-426614174003' },
        relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
      });
      expect(booksRepository.find).toHaveBeenCalledWith({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when user has no reviews', async () => {
      // Mock reviewsRepository.find to return empty array
      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce([]);

      const result = await service.getGenreBasedRecommendations('123e4567-e89b-12d3-a456-426614174003', 5);

      expect(result).toEqual([]);
    });
  });

  describe('getFavoriteBasedRecommendations', () => {
    it('should return books based on user favorites', async () => {
      // Create mock favorites
      const mockFavorites = [
        {
          userId: '123e4567-e89b-12d3-a456-426614174003',
          bookId: mockBook.id,
          createdAt: new Date(),
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
            favorites: [],
          } as User,
          book: {
            ...mockBook,
            author: 'Test Author',
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction' },
              } as BookGenre,
            ],
          },
        } as UserFavorite,
      ];

      // Mock favoritesService.getUserFavorites to return mockFavorites
      jest.spyOn(favoritesService, 'getUserFavorites').mockResolvedValueOnce(mockFavorites);
      
      // Mock booksRepository.find to return mockBooks
      jest.spyOn(booksRepository, 'find').mockResolvedValueOnce(mockBooks);

      const result = await service.getFavoriteBasedRecommendations('123e4567-e89b-12d3-a456-426614174003', 5);

      expect(favoritesService.getUserFavorites).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174003');
      expect(booksRepository.find).toHaveBeenCalledWith({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when user has no favorites', async () => {
      // Mock favoritesService.getUserFavorites to return empty array
      jest.spyOn(favoritesService, 'getUserFavorites').mockResolvedValueOnce([]);

      const result = await service.getFavoriteBasedRecommendations('123e4567-e89b-12d3-a456-426614174003', 5);

      expect(result).toEqual([]);
    });
  });

  describe('getLLMRecommendations', () => {
    it('should return LLM-based recommendations', async () => {
      // Create mock reviews and favorites
      const mockReviewsWithGenres = [
        {
          ...mockReview,
          book: {
            ...mockBook,
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction' },
              } as BookGenre,
            ],
          } as Book,
        } as Review,
      ];

      const mockFavorites = [
        {
          userId: '123e4567-e89b-12d3-a456-426614174003',
          bookId: mockBook.id,
          createdAt: new Date(),
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
            favorites: [],
          } as User,
          book: {
            ...mockBook,
            author: 'Test Author',
            bookGenres: [
              {
                bookId: mockBook.id,
                genreId: '123e4567-e89b-12d3-a456-426614174001',
                genre: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Fiction' },
              } as BookGenre,
            ],
          },
        } as UserFavorite,
      ];

      // Mock reviewsRepository.find to return mockReviewsWithGenres
      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce(mockReviewsWithGenres);
      
      // Mock favoritesService.getUserFavorites to return mockFavorites
      jest.spyOn(favoritesService, 'getUserFavorites').mockResolvedValueOnce(mockFavorites);
      
      // Mock booksRepository.find to return mockBooks
      jest.spyOn(booksRepository, 'find').mockResolvedValueOnce(mockBooks);
      
      // Mock openAIService.getBookRecommendations to return mockBooks
      jest.spyOn(openAIService, 'getBookRecommendations').mockResolvedValueOnce(mockBooks);

      const result = await service.getLLMRecommendations('123e4567-e89b-12d3-a456-426614174003', 5);

      expect(reviewsRepository.find).toHaveBeenCalledWith({
        where: { userId: '123e4567-e89b-12d3-a456-426614174003' },
        relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
      });
      expect(favoritesService.getUserFavorites).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174003');
      expect(booksRepository.find).toHaveBeenCalledWith({
        relations: ['bookGenres', 'bookGenres.genre', 'reviews'],
      });
      expect(openAIService.getBookRecommendations).toHaveBeenCalled();
      expect(result).toEqual(mockBooks);
    });

    it('should return empty array when user has no reviews or favorites', async () => {
      // Mock reviewsRepository.find to return empty array
      jest.spyOn(reviewsRepository, 'find').mockResolvedValueOnce([]);
      
      // Mock favoritesService.getUserFavorites to return empty array
      jest.spyOn(favoritesService, 'getUserFavorites').mockResolvedValueOnce([]);

      const result = await service.getLLMRecommendations('123e4567-e89b-12d3-a456-426614174003', 5);

      expect(result).toEqual([]);
    });
  });
});
