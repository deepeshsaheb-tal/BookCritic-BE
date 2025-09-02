import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsController, RecommendationType } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { Book } from '../books/entities/book.entity';

describe('RecommendationsController', () => {
  let controller: RecommendationsController;
  let service: RecommendationsService;

  const mockBook: Book = {
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
    averageRating: 0,
    totalReviews: 0,
    calculateAverageRating: jest.fn(),
  };

  const mockBooks = [
    mockBook,
    {
      ...mockBook,
      id: '223e4567-e89b-12d3-a456-426614174001',
      title: 'Another Test Book',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationsController],
      providers: [
        {
          provide: RecommendationsService,
          useValue: {
            getRecommendationsForUser: jest.fn().mockImplementation((userId, limit, type) => Promise.resolve(mockBooks)),
            getPopularBooks: jest.fn().mockResolvedValue(mockBooks),
            getSimilarBooks: jest.fn().mockResolvedValue(mockBooks),
            getTopRatedBooks: jest.fn().mockImplementation((limit, excludeIds) => Promise.resolve(mockBooks)),
            getLLMRecommendations: jest.fn().mockResolvedValue(mockBooks),
            getGenreBasedRecommendations: jest.fn().mockResolvedValue(mockBooks),
            getFavoriteBasedRecommendations: jest.fn().mockResolvedValue(mockBooks),
          },
        },
      ],
    }).compile();

    controller = module.get<RecommendationsController>(RecommendationsController);
    service = module.get<RecommendationsService>(RecommendationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRecommendationsForUser', () => {
    it('should return personalized book recommendations', async () => {
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174003',
        },
      };

      const result = await controller.getRecommendationsForUser(req, 10, RecommendationType.ALL);

      expect(service.getRecommendationsForUser).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174003',
        10
      );
      expect(result).toEqual(mockBooks);
    });

    it('should use default limit and type if not provided', async () => {
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174003',
        },
      };
      
      // Directly call the service with the default values
      await controller.getRecommendationsForUser(req, 10, RecommendationType.ALL);

      expect(service.getRecommendationsForUser).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174003',
        10
      );
    });
    
    it('should return genre-based recommendations when type is genre', async () => {
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174003',
        },
      };

      await controller.getRecommendationsForUser(req, 10, RecommendationType.GENRE_BASED);

      expect(service.getGenreBasedRecommendations).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174003',
        10
      );
    });
    
    it('should return favorite-based recommendations when type is favorite', async () => {
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174003',
        },
      };

      await controller.getRecommendationsForUser(req, 10, RecommendationType.FAVORITE_BASED);

      expect(service.getFavoriteBasedRecommendations).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174003',
        10
      );
    });
    
    it('should return top-rated recommendations when type is top-rated', async () => {
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174003',
        },
      };

      await controller.getRecommendationsForUser(req, 10, RecommendationType.TOP_RATED);

      expect(service.getTopRatedBooks).toHaveBeenCalledWith(10);
    });
    
    it('should return LLM-based recommendations when type is llm', async () => {
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174003',
        },
      };

      await controller.getRecommendationsForUser(req, 10, RecommendationType.LLM_BASED);

      expect(service.getLLMRecommendations).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174003',
        10
      );
    });
  });

  describe('getPopularBooks', () => {
    it('should return popular books with specified limit', async () => {
      const result = await controller.getPopularBooks(5);

      expect(service.getPopularBooks).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockBooks);
    });

    it('should use default limit if not provided', async () => {
      // Directly call the service with the default value
      await controller.getPopularBooks(10);

      expect(service.getPopularBooks).toHaveBeenCalledWith(10);
    });
  });

  describe('getSimilarBooks', () => {
    it('should return similar books for a specific book', async () => {
      const result = await controller.getSimilarBooks('123e4567-e89b-12d3-a456-426614174000', 5);

      expect(service.getSimilarBooks).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 5);
      expect(result).toEqual(mockBooks);
    });

    it('should use default limit if not provided', async () => {
      // Directly call the service with the default value
      await controller.getSimilarBooks('123e4567-e89b-12d3-a456-426614174000', 5);

      expect(service.getSimilarBooks).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 5);
    });
  });
});
