import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

describe('GenresService', () => {
  let service: GenresService;
  let mockRepository: any;
  let loggerSpy: jest.SpyInstance;

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
          id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'Test Book',
          author: 'Test Author',
          description: 'Test Description',
          isbn: '1234567890',
          publishedDate: new Date('2023-01-01'),
          coverImageUrl: 'test.jpg',
          bookGenres: [],
          reviews: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        genre: mockGenre,
      },
    ],
  };

  beforeEach(async () => {
    // Create a spy on the Logger before the module is initialized
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findByIds: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GenresService>(GenresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new genre', async () => {
      const createGenreDto: CreateGenreDto = {
        name: 'Fiction',
        description: 'Fiction books',
      };

      mockRepository.create.mockReturnValue(mockGenre);
      mockRepository.save.mockResolvedValue(mockGenre);

      const result = await service.create(createGenreDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createGenreDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockGenre);
      expect(result).toEqual(mockGenre);
      expect(loggerSpy).toHaveBeenCalledWith(`Creating new genre: ${createGenreDto.name}`);
    });
  });

  describe('findAll', () => {
    it('should return an array of genres', async () => {
      mockRepository.find.mockResolvedValue([mockGenre]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
      expect(result).toEqual([mockGenre]);
      expect(loggerSpy).toHaveBeenCalledWith('Finding all genres');
    });
  });

  describe('findOne', () => {
    it('should return a genre when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockGenre);

      const result = await service.findOne(mockGenre.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockGenre.id },
        relations: ['bookGenres', 'bookGenres.book'],
      });
      expect(result).toEqual(mockGenre);
      expect(loggerSpy).toHaveBeenCalledWith(`Finding genre with ID: ${mockGenre.id}`);
    });

    it('should throw NotFoundException when genre does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
        relations: ['bookGenres', 'bookGenres.book'],
      });
    });
  });

  describe('update', () => {
    it('should update a genre when it exists', async () => {
      const updateGenreDto: UpdateGenreDto = {
        name: 'Updated Fiction',
        description: 'Updated description',
      };
      const updatedGenre = { ...mockGenre, ...updateGenreDto };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockGenre);
      mockRepository.save.mockResolvedValue(updatedGenre);

      const result = await service.update(mockGenre.id, updateGenreDto);

      expect(service.findOne).toHaveBeenCalledWith(mockGenre.id);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockGenre,
        ...updateGenreDto,
      });
      expect(result).toEqual(updatedGenre);
      expect(loggerSpy).toHaveBeenCalledWith(`Updating genre with ID: ${mockGenre.id}`);
    });

    it('should throw NotFoundException when genre does not exist', async () => {
      const updateGenreDto: UpdateGenreDto = {
        name: 'Updated Fiction',
      };

      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.update('nonexistent-id', updateGenreDto)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('remove', () => {
    it('should remove a genre when it exists', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGenre);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove(mockGenre.id);

      expect(service.findOne).toHaveBeenCalledWith(mockGenre.id);
      expect(mockRepository.remove).toHaveBeenCalledWith(mockGenre);
      expect(loggerSpy).toHaveBeenCalledWith(`Removing genre with ID: ${mockGenre.id}`);
    });

    it('should throw NotFoundException when genre does not exist', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('findBooksInGenre', () => {
    it('should return a genre with books when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockGenreWithBooks);

      const result = await service.findBooksInGenre(mockGenre.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockGenre.id },
        relations: ['bookGenres', 'bookGenres.book'],
      });
      expect(result).toEqual(mockGenreWithBooks);
      expect(loggerSpy).toHaveBeenCalledWith(`Finding books in genre with ID: ${mockGenre.id}`);
    });

    it('should throw NotFoundException when genre does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findBooksInGenre('nonexistent-id')).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
        relations: ['bookGenres', 'bookGenres.book'],
      });
    });
  });

  describe('findByIds', () => {
    it('should return genres with matching ids', async () => {
      const ids = [mockGenre.id, 'another-id'];
      mockRepository.findByIds.mockResolvedValue([mockGenre]);

      const result = await service.findByIds(ids);

      expect(mockRepository.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual([mockGenre]);
      expect(loggerSpy).toHaveBeenCalledWith(`Finding genres with IDs: ${ids.join(', ')}`);
    });
  });
});
