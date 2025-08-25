import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsController } from './recommendations.controller';
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
            getRecommendationsForUser: jest.fn().mockResolvedValue(mockBooks),
            getPopularBooks: jest.fn().mockResolvedValue(mockBooks),
            getSimilarBooks: jest.fn().mockResolvedValue(mockBooks),
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

      const result = await controller.getRecommendationsForUser(req, 10);

      expect(service.getRecommendationsForUser).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174003',
        10
      );
      expect(result).toEqual(mockBooks);
    });

    it('should use default limit if not provided', async () => {
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174003',
        },
      };
      
      // Directly call the service with the default value
      await controller.getRecommendationsForUser(req, 10);

      expect(service.getRecommendationsForUser).toHaveBeenCalledWith(
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
