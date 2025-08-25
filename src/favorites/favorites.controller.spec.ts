import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Book } from '../books/entities/book.entity';
import { UserFavorite } from './entities/user-favorite.entity';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let service: FavoritesService;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const bookId = '223e4567-e89b-12d3-a456-426614174001';

  const mockBook: Book = {
    id: bookId,
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

  const mockUserFavorite: UserFavorite = {
    userId,
    bookId,
    createdAt: new Date(),
    user: { 
      id: userId, 
      email: 'test@example.com',
      displayName: 'Test User',
      passwordHash: 'hashed_password',
      role: 'user',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: [],
      favorites: []
    },
    book: mockBook,
  };

  const mockUserFavorites = [mockUserFavorite];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        {
          provide: FavoritesService,
          useValue: {
            addFavorite: jest.fn(),
            removeFavorite: jest.fn(),
            isFavorite: jest.fn(),
            getUserFavorites: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
    service = module.get<FavoritesService>(FavoritesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addFavorite', () => {
    it('should add a book to user favorites', async () => {
      const req = { user: { id: userId } };
      
      jest.spyOn(service, 'addFavorite').mockResolvedValue(mockUserFavorite);

      const result = await controller.addFavorite(req, bookId);

      expect(service.addFavorite).toHaveBeenCalledWith(userId, bookId);
      expect(result).toEqual(mockUserFavorite);
    });

    it('should throw ConflictException if book is already a favorite', async () => {
      const req = { user: { id: userId } };
      
      jest.spyOn(service, 'addFavorite').mockRejectedValue(
        new ConflictException('Book is already in favorites'),
      );

      await expect(controller.addFavorite(req, bookId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeFavorite', () => {
    it('should remove a book from user favorites', async () => {
      const req = { user: { id: userId } };
      
      jest.spyOn(service, 'removeFavorite').mockResolvedValue(undefined);

      await controller.removeFavorite(req, bookId);

      expect(service.removeFavorite).toHaveBeenCalledWith(userId, bookId);
    });

    it('should throw NotFoundException if book is not a favorite', async () => {
      const req = { user: { id: userId } };
      
      jest.spyOn(service, 'removeFavorite').mockRejectedValue(
        new NotFoundException('Book is not in favorites'),
      );

      await expect(controller.removeFavorite(req, bookId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkFavorite', () => {
    it('should return true if book is a favorite', async () => {
      const req = { user: { id: userId } };
      
      jest.spyOn(service, 'isFavorite').mockResolvedValue(true);

      const result = await controller.checkFavorite(req, bookId);

      expect(service.isFavorite).toHaveBeenCalledWith(userId, bookId);
      expect(result).toEqual({ isFavorite: true });
    });

    it('should return false if book is not a favorite', async () => {
      const req = { user: { id: userId } };
      
      jest.spyOn(service, 'isFavorite').mockResolvedValue(false);

      const result = await controller.checkFavorite(req, bookId);

      expect(service.isFavorite).toHaveBeenCalledWith(userId, bookId);
      expect(result).toEqual({ isFavorite: false });
    });
  });

  describe('getUserFavorites', () => {
    it('should return user favorite books', async () => {
      const req = { user: { id: userId } };
      
      jest.spyOn(service, 'getUserFavorites').mockResolvedValue(mockUserFavorites);
      
      const result = await controller.getUserFavorites(req);

      expect(service.getUserFavorites).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserFavorites);
    });
  });
});
