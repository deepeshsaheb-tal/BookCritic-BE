import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BooksService } from '../books/books.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let repository: Repository<Review>;
  let booksService: BooksService;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

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

  const createQueryBuilderMock = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ averageRating: '4.5' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: {
            create: jest.fn().mockReturnValue(mockReview),
            save: jest.fn().mockResolvedValue(mockReview),
            findOne: jest.fn(),
            findAndCount: jest.fn().mockResolvedValue([mockReviews, 2]),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
          },
        },
        {
          provide: BooksService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockReview.book),
            calculateBookRatingStats: jest.fn().mockResolvedValue({ averageRating: 4.5, totalReviews: 2 }),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    repository = module.get<Repository<Review>>(getRepositoryToken(Review));
    booksService = module.get<BooksService>(BooksService);
    
    // Setup logger spies after service is instantiated
    const logger = (service as any).logger;
    loggerLogSpy = jest.spyOn(logger, 'log');
    loggerWarnSpy = jest.spyOn(logger, 'warn');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new review and update book rating stats', async () => {
      const createReviewDto: CreateReviewDto = {
        bookId: '123e4567-e89b-12d3-a456-426614174001',
        rating: 4,
        content: 'Great book!',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      const result = await service.create('123e4567-e89b-12d3-a456-426614174002', createReviewDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId: '123e4567-e89b-12d3-a456-426614174002',
          bookId: '123e4567-e89b-12d3-a456-426614174001',
        },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...createReviewDto,
        userId: '123e4567-e89b-12d3-a456-426614174002',
      });
      expect(repository.save).toHaveBeenCalledWith(mockReview);
      expect(booksService.findOne).toHaveBeenCalledWith(createReviewDto.bookId);
      expect(result).toEqual(mockReview);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Creating new review for book ${createReviewDto.bookId} by user 123e4567-e89b-12d3-a456-426614174002`);
    });

    it('should throw ForbiddenException if user already reviewed the book', async () => {
      const createReviewDto: CreateReviewDto = {
        bookId: '123e4567-e89b-12d3-a456-426614174001',
        rating: 4,
        content: 'Great book!',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockReview);

      await expect(
        service.create('123e4567-e89b-12d3-a456-426614174002', createReviewDto),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId: '123e4567-e89b-12d3-a456-426614174002',
          bookId: '123e4567-e89b-12d3-a456-426614174001',
        },
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(`Creating new review for book ${createReviewDto.bookId} by user 123e4567-e89b-12d3-a456-426614174002`);
      expect(loggerWarnSpy).toHaveBeenCalledWith(`User 123e4567-e89b-12d3-a456-426614174002 already reviewed book ${createReviewDto.bookId}`);
    });
  });

  describe('findAll', () => {
    it('should return reviews with pagination', async () => {
      const result = await service.findAll(0, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: ['user', 'book'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ reviews: mockReviews, total: 2 });
    });

    it('should use default pagination values', async () => {
      const result = await service.findAll();

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: ['user', 'book'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ reviews: mockReviews, total: 2 });
    });
  });

  describe('findByBookId', () => {
    it('should return reviews for a specific book', async () => {
      const result = await service.findByBookId('123e4567-e89b-12d3-a456-426614174001', 0, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { bookId: '123e4567-e89b-12d3-a456-426614174001' },
        skip: 0,
        take: 10,
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ reviews: mockReviews, total: 2 });
    });

    it('should use default pagination values when not provided', async () => {
      const result = await service.findByBookId('123e4567-e89b-12d3-a456-426614174001');

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { bookId: '123e4567-e89b-12d3-a456-426614174001' },
        skip: 0,
        take: 10,
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ reviews: mockReviews, total: 2 });
    });
  });

  describe('findByUserId', () => {
    it('should return reviews by a specific user', async () => {
      const result = await service.findByUserId('123e4567-e89b-12d3-a456-426614174002', 0, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { userId: '123e4567-e89b-12d3-a456-426614174002' },
        skip: 0,
        take: 10,
        relations: ['book'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ reviews: mockReviews, total: 2 });
    });

    it('should use default pagination values when not provided', async () => {
      const result = await service.findByUserId('123e4567-e89b-12d3-a456-426614174002');

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { userId: '123e4567-e89b-12d3-a456-426614174002' },
        skip: 0,
        take: 10,
        relations: ['book'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ reviews: mockReviews, total: 2 });
    });
  });

  describe('findOne', () => {
    it('should return a review when it exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockReview);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        relations: ['user', 'book'],
      });
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        relations: ['user', 'book'],
      });
    });
  });

  describe('update', () => {
    it('should update a review when it exists and belongs to the user and update book rating stats', async () => {
      const updateReviewDto: UpdateReviewDto = {
        rating: 5,
        content: 'Updated review content',
      };

      // Mock the findOne method in service to return the mockReview
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockReview);
      
      // Create an updated review with the new data
      const updatedReview = { ...mockReview, ...updateReviewDto };
      jest.spyOn(repository, 'save').mockResolvedValueOnce(updatedReview);

      const result = await service.update(
        '123e4567-e89b-12d3-a456-426614174000', // reviewId
        '123e4567-e89b-12d3-a456-426614174002', // userId matches mockReview.userId
        updateReviewDto,
      );

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.save).toHaveBeenCalledWith({
        ...mockReview,
        ...updateReviewDto,
      });
      expect(booksService.findOne).toHaveBeenCalledWith(mockReview.bookId);
      expect(result).toEqual(updatedReview);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Updating review with ID: 123e4567-e89b-12d3-a456-426614174000 by user 123e4567-e89b-12d3-a456-426614174002`);
    });
    
    it('should throw NotFoundException when review does not exist', async () => {
      const updateReviewDto: UpdateReviewDto = {
        rating: 5,
        content: 'Updated review content',
      };

      // Mock findOne to throw NotFoundException
      jest.spyOn(service, 'findOne').mockImplementation(() => {
        throw new NotFoundException(`Review with ID 123e4567-e89b-12d3-a456-426614174000 not found`);
      });

      await expect(
        service.update(
          '123e4567-e89b-12d3-a456-426614174000', // reviewId
          '123e4567-e89b-12d3-a456-426614174002', // userId
          updateReviewDto,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.save).not.toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(`Updating review with ID: 123e4567-e89b-12d3-a456-426614174000 by user 123e4567-e89b-12d3-a456-426614174002`);
    });
    
    it('should throw ForbiddenException when review belongs to another user', async () => {
      const updateReviewDto: UpdateReviewDto = {
        rating: 5,
        content: 'Updated review content',
      };

      const reviewFromAnotherUser = { ...mockReview, userId: 'another-user-id' };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(reviewFromAnotherUser);

      await expect(
        service.update(
          '123e4567-e89b-12d3-a456-426614174000', // reviewId
          '123e4567-e89b-12d3-a456-426614174002', // userId - Different from reviewFromAnotherUser.userId
          updateReviewDto,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.save).not.toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(`Updating review with ID: 123e4567-e89b-12d3-a456-426614174000 by user 123e4567-e89b-12d3-a456-426614174002`);
      expect(loggerWarnSpy).toHaveBeenCalledWith(`User 123e4567-e89b-12d3-a456-426614174002 attempted to update review 123e4567-e89b-12d3-a456-426614174000 created by user another-user-id`);
    });
  });

  describe('remove', () => {
    it('should remove a review when it exists and belongs to the user and update book rating stats', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockReview);

      await service.remove('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174002');

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.remove).toHaveBeenCalledWith(mockReview);
      expect(booksService.findOne).toHaveBeenCalledWith(mockReview.bookId);
    });

    it('should throw ForbiddenException when review belongs to another user', async () => {
      const reviewFromAnotherUser = { ...mockReview, userId: 'another-user-id' };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(reviewFromAnotherUser);

      await expect(
        service.remove('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174002'),
      ).rejects.toThrow(ForbiddenException);

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getAverageRating', () => {
    it('should return average rating for a book', async () => {
      const result = await service.getAverageRating('123e4567-e89b-12d3-a456-426614174001');

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(createQueryBuilderMock.select).toHaveBeenCalledWith('AVG(review.rating)', 'averageRating');
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith('review.bookId = :bookId', {
        bookId: '123e4567-e89b-12d3-a456-426614174001',
      });
      expect(createQueryBuilderMock.getRawOne).toHaveBeenCalled();
      expect(result).toEqual(4.5);
    });

    it('should return 0 when no reviews exist', async () => {
      jest.spyOn(createQueryBuilderMock, 'getRawOne').mockResolvedValueOnce({});

      const result = await service.getAverageRating('123e4567-e89b-12d3-a456-426614174001');

      expect(result).toEqual(0);
    });
  });
  
  describe('updateBookRatingStats', () => {
    it('should call booksService.findOne with the correct bookId', async () => {
      // Access the private method using type assertion
      await (service as any).updateBookRatingStats('123e4567-e89b-12d3-a456-426614174001');
      
      expect(booksService.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001');
    });
    
    it('should handle errors gracefully', async () => {
      jest.spyOn(booksService, 'findOne').mockRejectedValueOnce(new Error('Test error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Should not throw an error
      await expect((service as any).updateBookRatingStats('123e4567-e89b-12d3-a456-426614174001')).resolves.not.toThrow();
      
      expect(booksService.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001');
      // Restore console.error
      (console.error as jest.Mock).mockRestore();
    });
  });
});
