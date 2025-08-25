import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { BookGenre } from './entities/book-genre.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { NotFoundException } from '@nestjs/common';

describe('BooksService', () => {
  let service: BooksService;
  let bookRepository: Repository<Book>;
  let bookGenreRepository: Repository<BookGenre>;

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

  const mockBookWithGenres: Book = {
    ...mockBook,
    bookGenres: [
      {
        bookId: '123e4567-e89b-12d3-a456-426614174000',
        genreId: '123e4567-e89b-12d3-a456-426614174002',
        genre: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Fiction',
          description: 'Fiction genre',
          createdAt: new Date(),
          updatedAt: new Date(),
          bookGenres: [],
        },
        book: undefined,
      },
    ],
  };

  const mockBooks = [mockBook, { ...mockBook, id: '223e4567-e89b-12d3-a456-426614174001' }];

  const createQueryBuilderMock = {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([mockBooks, 2]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: {
            create: jest.fn().mockReturnValue(mockBook),
            save: jest.fn().mockResolvedValue(mockBook),
            findOne: jest.fn(),
            find: jest.fn().mockResolvedValue(mockBooks),
            findAndCount: jest.fn().mockResolvedValue([mockBooks, 2]),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
          },
        },
        {
          provide: getRepositoryToken(BookGenre),
          useValue: {
            create: jest.fn().mockImplementation((bookGenre) => bookGenre),
            save: jest.fn().mockResolvedValue([]),
            delete: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    bookRepository = module.get<Repository<Book>>(getRepositoryToken(Book));
    bookGenreRepository = module.get<Repository<BookGenre>>(getRepositoryToken(BookGenre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new book without genres', async () => {
      const createBookDto: CreateBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890123',
        description: 'Test description',
        coverImageUrl: 'http://example.com/cover.jpg',
        publishedDate: '2023-01-01',
      };

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockBook);

      const result = await service.create(createBookDto);

      expect(bookRepository.create).toHaveBeenCalledWith(createBookDto);
      expect(bookRepository.save).toHaveBeenCalledWith(mockBook);
      expect(service.findOne).toHaveBeenCalledWith(mockBook.id);
      expect(result).toEqual(mockBook);
    });

    it('should create a new book with genres', async () => {
      const createBookDto: CreateBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890123',
        description: 'Test description',
        coverImageUrl: 'http://example.com/cover.jpg',
        publishedDate: '2023-01-01',
        genreIds: ['123e4567-e89b-12d3-a456-426614174002'],
      };

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockBookWithGenres);

      const result = await service.create(createBookDto);

      expect(bookRepository.create).toHaveBeenCalledWith({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890123',
        description: 'Test description',
        coverImageUrl: 'http://example.com/cover.jpg',
        publishedDate: '2023-01-01',
      });
      expect(bookRepository.save).toHaveBeenCalledWith(mockBook);
      expect(bookGenreRepository.delete).toHaveBeenCalledWith({ bookId: mockBook.id });
      expect(bookGenreRepository.create).toHaveBeenCalledWith({
        bookId: mockBook.id,
        genreId: '123e4567-e89b-12d3-a456-426614174002',
      });
      expect(bookGenreRepository.save).toHaveBeenCalled();
      expect(service.findOne).toHaveBeenCalledWith(mockBook.id);
      expect(result).toEqual(mockBookWithGenres);
    });
  });

  describe('findAll', () => {
    it('should return books with pagination when parameters are provided', async () => {
      const result = await service.findAll(0, 10);

      expect(bookRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: ['bookGenres', 'bookGenres.genre'],
      });
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });

    it('should use default pagination parameters when none are provided', async () => {
      const result = await service.findAll();

      expect(bookRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: ['bookGenres', 'bookGenres.genre'],
      });
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });

    it('should use default take parameter when only skip is provided', async () => {
      const result = await service.findAll(5);

      expect(bookRepository.findAndCount).toHaveBeenCalledWith({
        skip: 5,
        take: 10,
        relations: ['bookGenres', 'bookGenres.genre'],
      });
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });
  });

  describe('findOne', () => {
    it('should return a book when it exists', async () => {
      jest.spyOn(bookRepository, 'findOne').mockResolvedValueOnce(mockBook);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(bookRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        relations: ['bookGenres', 'bookGenres.genre', 'reviews', 'reviews.user'],
      });
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundException when book does not exist', async () => {
      jest.spyOn(bookRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(bookRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        relations: ['bookGenres', 'bookGenres.genre', 'reviews', 'reviews.user'],
      });
    });
  });

  describe('search', () => {
    it('should search books by query with explicit pagination parameters', async () => {
      const result = await service.search('test', 0, 10);

      expect(bookRepository.createQueryBuilder).toHaveBeenCalled();
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith('book.title ILIKE :query', { query: '%test%' });
      expect(createQueryBuilderMock.orWhere).toHaveBeenCalledWith('book.author ILIKE :query', { query: '%test%' });
      expect(createQueryBuilderMock.orWhere).toHaveBeenCalledWith('book.isbn = :isbn', { isbn: 'test' });
      expect(createQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('book.bookGenres', 'bookGenres');
      expect(createQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('bookGenres.genre', 'genre');
      expect(createQueryBuilderMock.skip).toHaveBeenCalledWith(0);
      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(10);
      expect(createQueryBuilderMock.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });

    it('should search books by query with default pagination parameters', async () => {
      const result = await service.search('test');

      expect(bookRepository.createQueryBuilder).toHaveBeenCalled();
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith('book.title ILIKE :query', { query: '%test%' });
      expect(createQueryBuilderMock.orWhere).toHaveBeenCalledWith('book.author ILIKE :query', { query: '%test%' });
      expect(createQueryBuilderMock.orWhere).toHaveBeenCalledWith('book.isbn = :isbn', { isbn: 'test' });
      expect(createQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('book.bookGenres', 'bookGenres');
      expect(createQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('bookGenres.genre', 'genre');
      expect(createQueryBuilderMock.skip).toHaveBeenCalledWith(0);
      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(10);
      expect(createQueryBuilderMock.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });

    it('should search books by query with default take parameter', async () => {
      const result = await service.search('test', 5);

      expect(bookRepository.createQueryBuilder).toHaveBeenCalled();
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith('book.title ILIKE :query', { query: '%test%' });
      expect(createQueryBuilderMock.orWhere).toHaveBeenCalledWith('book.author ILIKE :query', { query: '%test%' });
      expect(createQueryBuilderMock.orWhere).toHaveBeenCalledWith('book.isbn = :isbn', { isbn: 'test' });
      expect(createQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('book.bookGenres', 'bookGenres');
      expect(createQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('bookGenres.genre', 'genre');
      expect(createQueryBuilderMock.skip).toHaveBeenCalledWith(5);
      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(10);
      expect(createQueryBuilderMock.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });
  });

  describe('update', () => {
    it('should update a book without genres', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Book',
      };

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockBook);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...mockBook,
        title: 'Updated Book',
      });

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateBookDto);

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(bookRepository.save).toHaveBeenCalledWith({
        ...mockBook,
        title: 'Updated Book',
      });
      expect(result).toEqual({
        ...mockBook,
        title: 'Updated Book',
      });
    });

    it('should update a book with genres', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Book',
        genreIds: ['123e4567-e89b-12d3-a456-426614174002'],
      };

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockBook);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...mockBookWithGenres,
        title: 'Updated Book',
      });

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateBookDto);

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(bookRepository.save).toHaveBeenCalledWith({
        ...mockBook,
        title: 'Updated Book',
      });
      expect(bookGenreRepository.delete).toHaveBeenCalledWith({ bookId: '123e4567-e89b-12d3-a456-426614174000' });
      expect(bookGenreRepository.create).toHaveBeenCalledWith({
        bookId: '123e4567-e89b-12d3-a456-426614174000',
        genreId: '123e4567-e89b-12d3-a456-426614174002',
      });
      expect(bookGenreRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockBookWithGenres,
        title: 'Updated Book',
      });
    });
  });

  describe('remove', () => {
    it('should remove a book', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockBook);

      await service.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(bookGenreRepository.delete).toHaveBeenCalledWith({ bookId: '123e4567-e89b-12d3-a456-426614174000' });
      expect(bookRepository.remove).toHaveBeenCalledWith(mockBook);
    });
  });
});
