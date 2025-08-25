import { Test, TestingModule } from '@nestjs/testing';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { NotFoundException } from '@nestjs/common';

describe('GenresController', () => {
  let controller: GenresController;
  let service: GenresService;

  const mockGenre: Genre = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Fiction',
    description: 'Fiction books',
    bookGenres: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGenreWithBooks: Genre = {
    ...mockGenre,
    bookGenres: [
      {
        bookId: '123e4567-e89b-12d3-a456-426614174002',
        genreId: mockGenre.id,
        book: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Book',
          author: 'Test Author',
          description: 'Test description',
          isbn: '1234567890123',
          publishedDate: new Date('2023-01-01'),
          coverImageUrl: 'http://example.com/cover.jpg',
          bookGenres: [],
          reviews: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          averageRating: 0,
          totalReviews: 0,
          calculateAverageRating: jest.fn(),
        },
        genre: mockGenre,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenresController],
      providers: [
        {
          provide: GenresService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findBooksInGenre: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GenresController>(GenresController);
    service = module.get<GenresService>(GenresService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new genre', async () => {
      const createGenreDto: CreateGenreDto = {
        name: 'Fiction',
        description: 'Fiction books',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockGenre);

      const result = await controller.create(createGenreDto);

      expect(service.create).toHaveBeenCalledWith(createGenreDto);
      expect(result).toEqual(mockGenre);
    });
  });

  describe('findAll', () => {
    it('should return an array of genres', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([mockGenre]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockGenre]);
    });
  });

  describe('findOne', () => {
    it('should return a genre when it exists', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGenre);

      const result = await controller.findOne(mockGenre.id);

      expect(service.findOne).toHaveBeenCalledWith(mockGenre.id);
      expect(result).toEqual(mockGenre);
    });

    it('should throw NotFoundException when genre does not exist', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('update', () => {
    it('should update a genre when it exists', async () => {
      const updateGenreDto: UpdateGenreDto = {
        name: 'Updated Fiction',
        description: 'Updated description',
      };
      const updatedGenre = { ...mockGenre, ...updateGenreDto };

      jest.spyOn(service, 'update').mockResolvedValue(updatedGenre);

      const result = await controller.update(mockGenre.id, updateGenreDto);

      expect(service.update).toHaveBeenCalledWith(mockGenre.id, updateGenreDto);
      expect(result).toEqual(updatedGenre);
    });

    it('should throw NotFoundException when genre does not exist', async () => {
      const updateGenreDto: UpdateGenreDto = {
        name: 'Updated Fiction',
      };

      jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException());

      await expect(controller.update('nonexistent-id', updateGenreDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith('nonexistent-id', updateGenreDto);
    });
  });

  describe('remove', () => {
    it('should remove a genre when it exists', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove(mockGenre.id);

      expect(service.remove).toHaveBeenCalledWith(mockGenre.id);
    });

    it('should throw NotFoundException when genre does not exist', async () => {
      jest.spyOn(service, 'remove').mockRejectedValue(new NotFoundException());

      await expect(controller.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('findBooksInGenre', () => {
    it('should return a genre with books when it exists', async () => {
      jest.spyOn(service, 'findBooksInGenre').mockResolvedValue(mockGenreWithBooks);

      const result = await controller.findBooksInGenre(mockGenre.id);

      expect(service.findBooksInGenre).toHaveBeenCalledWith(mockGenre.id);
      expect(result).toEqual(mockGenreWithBooks);
    });

    it('should throw NotFoundException when genre does not exist', async () => {
      jest.spyOn(service, 'findBooksInGenre').mockRejectedValue(new NotFoundException());

      await expect(controller.findBooksInGenre('nonexistent-id')).rejects.toThrow(NotFoundException);
      expect(service.findBooksInGenre).toHaveBeenCalledWith('nonexistent-id');
    });
  });
});
