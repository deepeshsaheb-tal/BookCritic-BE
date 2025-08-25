import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

/**
 * Service for managing genre operations
 */
@Injectable()
export class GenresService {
  private readonly logger = new Logger(GenresService.name);

  constructor(
    @InjectRepository(Genre)
    private readonly genresRepository: Repository<Genre>,
  ) {}

  /**
   * Create a new genre
   * @param createGenreDto - Genre creation data
   * @returns The created genre entity
   */
  async create(createGenreDto: CreateGenreDto): Promise<Genre> {
    this.logger.log(`Creating new genre: ${createGenreDto.name}`);
    
    const genre = this.genresRepository.create(createGenreDto);
    return this.genresRepository.save(genre);
  }

  /**
   * Find all genres
   * @returns Array of genre entities
   */
  async findAll(): Promise<Genre[]> {
    this.logger.log('Finding all genres');
    
    return this.genresRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Find a genre by ID
   * @param id - Genre ID
   * @returns Genre entity if found
   * @throws NotFoundException if genre not found
   */
  async findOne(id: string): Promise<Genre> {
    this.logger.log(`Finding genre with ID: ${id}`);
    
    const genre = await this.genresRepository.findOne({
      where: { id },
      relations: ['bookGenres', 'bookGenres.book'],
    });
    
    if (!genre) {
      this.logger.warn(`Genre with ID ${id} not found`);
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }
    
    return genre;
  }

  /**
   * Update a genre
   * @param id - Genre ID
   * @param updateGenreDto - Genre update data
   * @returns Updated genre entity
   * @throws NotFoundException if genre not found
   */
  async update(id: string, updateGenreDto: UpdateGenreDto): Promise<Genre> {
    this.logger.log(`Updating genre with ID: ${id}`);
    
    const genre = await this.findOne(id);
    
    Object.assign(genre, updateGenreDto);
    
    return this.genresRepository.save(genre);
  }

  /**
   * Remove a genre
   * @param id - Genre ID
   * @returns Void
   * @throws NotFoundException if genre not found
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removing genre with ID: ${id}`);
    
    const genre = await this.findOne(id);
    
    await this.genresRepository.remove(genre);
  }

  /**
   * Find books by genre ID
   * @param id - Genre ID
   * @returns Genre entity with related books
   * @throws NotFoundException if genre not found
   */
  async findBooksInGenre(id: string): Promise<Genre> {
    this.logger.log(`Finding books in genre with ID: ${id}`);
    
    const genre = await this.genresRepository.findOne({
      where: { id },
      relations: ['bookGenres', 'bookGenres.book'],
    });
    
    if (!genre) {
      this.logger.warn(`Genre with ID ${id} not found`);
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }
    
    return genre;
  }

  /**
   * Find genres by IDs
   * @param ids - Array of genre IDs
   * @returns Array of genre entities
   */
  async findByIds(ids: string[]): Promise<Genre[]> {
    this.logger.log(`Finding genres with IDs: ${ids.join(', ')}`);
    
    return this.genresRepository.findByIds(ids);
  }
}
