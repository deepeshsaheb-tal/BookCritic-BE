import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: ReviewsService;

  const mockReview: Review = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    bookId: '123e4567-e89b-12d3-a456-426614174001',
    userId: '123e4567-e89b-12d3-a456-426614174002',
    rating: 4,
    content: 'Great book!',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      email: 'user@example.com',
      displayName: 'Test User',
      passwordHash: 'hashed_password',
      role: 'user',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: [],
      favorites: [],
    },
    book: {
      id: '123e4567-e89b-12d3-a456-426614174001',
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
      averageRating: 4.5,
      totalReviews: 2,
      calculateAverageRating: jest.fn(),
    },
  };

  const mockReviews = [
    mockReview,
    {
      ...mockReview,
      id: '223e4567-e89b-12d3-a456-426614174001',
      rating: 5,
      content: 'Excellent book!',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockReview),
            findAll: jest.fn().mockResolvedValue({ reviews: mockReviews, total: 2 }),
            findByBookId: jest.fn().mockResolvedValue({ reviews: mockReviews, total: 2 }),
            findByUserId: jest.fn().mockResolvedValue({ reviews: mockReviews, total: 2 }),
            findOne: jest.fn().mockImplementation((id: string) => {
              if (id === mockReview.id) {
                return Promise.resolve(mockReview);
              }
              return Promise.reject(new NotFoundException(`Review with ID ${id} not found`));
            }),
            update: jest.fn().mockImplementation((id: string, userId: string, dto: UpdateReviewDto) => {
              if (id === mockReview.id) {
                if (userId === mockReview.userId) {
                  return Promise.resolve({
                    ...mockReview,
                    ...dto,
                  });
                }
                return Promise.reject(new ForbiddenException('You can only update your own reviews'));
              }
              return Promise.reject(new NotFoundException(`Review with ID ${id} not found`));
            }),
            remove: jest.fn().mockImplementation((id: string, userId: string) => {
              if (id === mockReview.id) {
                if (userId === mockReview.userId) {
                  return Promise.resolve();
                }
                return Promise.reject(new ForbiddenException('You can only delete your own reviews'));
              }
              return Promise.reject(new NotFoundException(`Review with ID ${id} not found`));
            }),
            getAverageRating: jest.fn().mockResolvedValue(4.5),
          },
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new review', async () => {
      const createReviewDto: CreateReviewDto = {
        bookId: '123e4567-e89b-12d3-a456-426614174001',
        rating: 4,
        content: 'Great book!',
      };
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174002',
        },
      };

      const result = await controller.create(createReviewDto, req);

      expect(service.create).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174002', createReviewDto);
      expect(result).toEqual(mockReview);
    });
  });

  describe('findAll', () => {
    it('should return reviews with pagination', async () => {
      const result = await controller.findAll(0, 10);

      expect(service.findAll).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual({ reviews: mockReviews, total: 2 });
    });
  });

  describe('findByBookId', () => {
    it('should return reviews for a specific book', async () => {
      const result = await controller.findByBookId('123e4567-e89b-12d3-a456-426614174001', 0, 10);

      expect(service.findByBookId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001', 0, 10);
      expect(result).toEqual({ reviews: mockReviews, total: 2 });
    });
  });

  describe('findByUserId', () => {
    it('should return reviews by a specific user', async () => {
      const result = await controller.findByUserId('123e4567-e89b-12d3-a456-426614174002', 0, 10);

      expect(service.findByUserId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174002', 0, 10);
      expect(result).toEqual({ reviews: mockReviews, total: 2 });
    });
  });

  describe('findOne', () => {
    it('should return a review when it exists', async () => {
      const result = await controller.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(service.findOne).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('update', () => {
    it('should update a review when user is the author', async () => {
      const updateReviewDto: UpdateReviewDto = {
        rating: 5,
        content: 'Updated review content',
      };
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174002',
        },
      };

      const result = await controller.update('123e4567-e89b-12d3-a456-426614174000', updateReviewDto, req);

      expect(service.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174002',
        updateReviewDto,
      );
      expect(result).toEqual({
        ...mockReview,
        rating: 5,
        content: 'Updated review content',
      });
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const updateReviewDto: UpdateReviewDto = {
        rating: 5,
        content: 'Updated review content',
      };
      const req = {
        user: {
          id: 'different-user-id',
        },
      };

      await expect(
        controller.update('123e4567-e89b-12d3-a456-426614174000', updateReviewDto, req),
      ).rejects.toThrow(ForbiddenException);

      expect(service.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'different-user-id',
        updateReviewDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a review when user is the author', async () => {
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174002',
        },
      };

      await controller.remove('123e4567-e89b-12d3-a456-426614174000', req);

      expect(service.remove).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174002',
      );
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const req = {
        user: {
          id: 'different-user-id',
        },
      };

      await expect(controller.remove('123e4567-e89b-12d3-a456-426614174000', req)).rejects.toThrow(
        ForbiddenException,
      );

      expect(service.remove).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'different-user-id',
      );
    });
  });

  describe('getAverageRating', () => {
    it('should return average rating for a book', async () => {
      const result = await controller.getAverageRating('123e4567-e89b-12d3-a456-426614174001');

      expect(service.getAverageRating).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001');
      expect(result).toEqual({ averageRating: 4.5 });
    });
  });
});
