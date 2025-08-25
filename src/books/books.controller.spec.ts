import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { NotFoundException } from '@nestjs/common';

describe('BooksController', () => {
  let controller: BooksController;
  let service: BooksService;

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
      title: 'Another Book',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockBook),
            findAll: jest.fn().mockResolvedValue({ books: mockBooks, total: 2 }),
            search: jest.fn().mockResolvedValue({ books: mockBooks, total: 2 }),
            findOne: jest.fn().mockImplementation((id: string) => {
              if (id === mockBook.id) {
                return Promise.resolve(mockBook);
              }
              return Promise.reject(new NotFoundException(`Book with ID ${id} not found`));
            }),
            update: jest.fn().mockImplementation((id: string, dto: UpdateBookDto) => {
              if (id === mockBook.id) {
                return Promise.resolve({
                  ...mockBook,
                  ...dto,
                });
              }
              return Promise.reject(new NotFoundException(`Book with ID ${id} not found`));
            }),
            remove: jest.fn().mockImplementation((id: string) => {
              if (id === mockBook.id) {
                return Promise.resolve();
              }
              return Promise.reject(new NotFoundException(`Book with ID ${id} not found`));
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    service = module.get<BooksService>(BooksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new book', async () => {
      const createBookDto: CreateBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890123',
        description: 'Test description',
        coverImageUrl: 'http://example.com/cover.jpg',
        publishedDate: '2023-01-01',
      };

      const result = await controller.create(createBookDto);

      expect(service.create).toHaveBeenCalledWith(createBookDto);
      expect(result).toEqual(mockBook);
    });
  });

  describe('findAll', () => {
    it('should return books with pagination', async () => {
      const result = await controller.findAll(0, 10);

      expect(service.findAll).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });

    it('should use default pagination values', async () => {
      const result = await controller.findAll(0, 10);

      expect(service.findAll).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });
  });

  describe('search', () => {
    it('should search books by query', async () => {
      const result = await controller.search('test', 0, 10);

      expect(service.search).toHaveBeenCalledWith('test', 0, 10);
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });

    it('should use default pagination values', async () => {
      const result = await controller.search('test', 0, 10);

      expect(service.search).toHaveBeenCalledWith('test', 0, 10);
      expect(result).toEqual({ books: mockBooks, total: 2 });
    });
  });

  describe('findOne', () => {
    it('should return a book when it exists', async () => {
      const result = await controller.findOne(mockBook.id);

      expect(service.findOne).toHaveBeenCalledWith(mockBook.id);
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundException when book does not exist', async () => {
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(service.findOne).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('update', () => {
    it('should update a book when it exists', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Book',
      };

      const result = await controller.update(mockBook.id, updateBookDto);

      expect(service.update).toHaveBeenCalledWith(mockBook.id, updateBookDto);
      expect(result).toEqual({
        ...mockBook,
        title: 'Updated Book',
      });
    });

    it('should throw NotFoundException when book does not exist', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Book',
      };

      await expect(controller.update('non-existent-id', updateBookDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(service.update).toHaveBeenCalledWith('non-existent-id', updateBookDto);
    });
  });

  describe('remove', () => {
    it('should remove a book when it exists', async () => {
      await controller.remove(mockBook.id);

      expect(service.remove).toHaveBeenCalledWith(mockBook.id);
    });

    it('should throw NotFoundException when book does not exist', async () => {
      await expect(controller.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(service.remove).toHaveBeenCalledWith('non-existent-id');
    });
  });
});
