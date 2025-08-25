import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserFavorite } from './entities/user-favorite.entity';
import { BooksService } from '../books/books.service';
import { UsersService } from '../users/users.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository, DeleteResult } from 'typeorm';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let userFavoriteRepository: Repository<UserFavorite>;
  let booksService: BooksService;
  let usersService: UsersService;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const bookId = '223e4567-e89b-12d3-a456-426614174001';

  const mockUser: User = {
    id: userId,
    email: 'test@example.com',
    displayName: 'John Doe',
    passwordHash: 'hashedPassword',
    lastLogin: new Date(),
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    reviews: [],
    favorites: [],
  };

  const mockBook: Book = {
    id: bookId,
    title: 'Test Book',
    author: 'Test Author',
    description: 'Test Description',
    coverImageUrl: 'test.jpg',
    publishedDate: new Date(),
    isbn: '1234567890',
    averageRating: 4.5,
    totalReviews: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    reviews: [],
    bookGenres: [],
    favoritedBy: [],
    calculateAverageRating: function() {}
  };

  const mockUserFavorite: UserFavorite = {
    userId,
    bookId,
    user: mockUser,
    book: mockBook,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getRepositoryToken(UserFavorite),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: BooksService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    userFavoriteRepository = module.get<Repository<UserFavorite>>(
      getRepositoryToken(UserFavorite),
    );
    booksService = module.get<BooksService>(BooksService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addFavorite', () => {
    it('should add a book to user favorites', async () => {
      // Mock repository methods
      jest.spyOn(userFavoriteRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(booksService, 'findOne').mockResolvedValue(mockBook);
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userFavoriteRepository, 'create').mockReturnValue(mockUserFavorite);
      jest.spyOn(userFavoriteRepository, 'save').mockResolvedValue(mockUserFavorite);

      const result = await service.addFavorite(userId, bookId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(booksService.findOne).toHaveBeenCalledWith(bookId);
      expect(userFavoriteRepository.findOne).toHaveBeenCalledWith({
        where: { userId, bookId },
      });
      expect(userFavoriteRepository.create).toHaveBeenCalledWith({
        userId,
        bookId,
      });
      expect(userFavoriteRepository.save).toHaveBeenCalledWith(mockUserFavorite);
      expect(result).toEqual(mockUserFavorite);
    });

    it('should throw ConflictException if book is already a favorite', async () => {
      // Mock repository to return existing favorite
      jest.spyOn(userFavoriteRepository, 'findOne').mockResolvedValue(mockUserFavorite);
      jest.spyOn(booksService, 'findOne').mockResolvedValue(mockBook);
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);
      
      await expect(service.addFavorite(userId, bookId)).rejects.toThrow(
        ConflictException,
      );
      
      expect(userFavoriteRepository.findOne).toHaveBeenCalledWith({
        where: { userId, bookId },
      });
    });

    it('should throw NotFoundException if book does not exist', async () => {
      jest.spyOn(userFavoriteRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(booksService, 'findOne').mockRejectedValue(
        new NotFoundException(`Book with ID ${bookId} not found`)
      );

      await expect(service.addFavorite(userId, bookId)).rejects.toThrow(
        NotFoundException
      );
      
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(booksService.findOne).toHaveBeenCalledWith(bookId);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(usersService, 'findOne').mockRejectedValue(
        new NotFoundException(`User with ID ${userId} not found`)
      );

      await expect(service.addFavorite(userId, bookId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFavorite', () => {
    it('should remove a book from user favorites', async () => {
      // Mock delete to return affected rows
      const deleteResult: DeleteResult = { affected: 1, raw: {} };
      jest.spyOn(userFavoriteRepository, 'delete').mockResolvedValue(deleteResult);

      await service.removeFavorite(userId, bookId);

      expect(userFavoriteRepository.delete).toHaveBeenCalledWith({
        userId,
        bookId,
      });
    });

    it('should throw NotFoundException if favorite not found', async () => {
      // Mock delete to return no affected rows
      const deleteResult: DeleteResult = { affected: 0, raw: {} };
      jest.spyOn(userFavoriteRepository, 'delete').mockResolvedValue(deleteResult);
      
      await expect(service.removeFavorite(userId, bookId)).rejects.toThrow(
        NotFoundException
      );
      
      expect(userFavoriteRepository.delete).toHaveBeenCalledWith({
        userId,
        bookId,
      });
    });
  });

  describe('isFavorite', () => {
    it('should return true if book is a favorite', async () => {
      // Mock count to return 1 (favorite exists)
      jest.spyOn(userFavoriteRepository, 'count').mockResolvedValue(1);

      const result = await service.isFavorite(userId, bookId);

      expect(userFavoriteRepository.count).toHaveBeenCalledWith({
        where: { userId, bookId },
      });
      expect(result).toBe(true);
    });

    it('should return false if book is not a favorite', async () => {
      // Mock count to return 0 (favorite doesn't exist)
      jest.spyOn(userFavoriteRepository, 'count').mockResolvedValue(0);

      const result = await service.isFavorite(userId, bookId);

      expect(userFavoriteRepository.count).toHaveBeenCalledWith({
        where: { userId, bookId },
      });
      expect(result).toBe(false);
    });
  });

  describe('getUserFavorites', () => {
    it('should return user favorite books', async () => {
      // Mock dependencies
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);
      
      // Mock find to return favorites with relations
      const userFavorites = [mockUserFavorite];
      jest.spyOn(userFavoriteRepository, 'find').mockResolvedValue(userFavorites);

      const result = await service.getUserFavorites(userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(userFavoriteRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['book', 'book.bookGenres', 'book.bookGenres.genre'],
      });
      expect(result).toEqual(userFavorites);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      // Mock usersService to throw error
      jest.spyOn(usersService, 'findOne').mockRejectedValue(
        new NotFoundException(`User with ID ${userId} not found`)
      );

      await expect(service.getUserFavorites(userId)).rejects.toThrow(
        NotFoundException
      );
      
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
    });
  });
});
