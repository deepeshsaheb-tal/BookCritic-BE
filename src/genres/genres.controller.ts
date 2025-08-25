import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiOperation, 
  ApiParam, 
  ApiResponse, 
  ApiTags 
} from '@nestjs/swagger';
import { GenresService } from './genres.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Genre } from './entities/genre.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Controller for genre-related endpoints
 */
@ApiTags('genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  /**
   * Create a new genre
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new genre' })
  @ApiResponse({ 
    status: 201, 
    description: 'The genre has been successfully created.',
    type: Genre 
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createGenreDto: CreateGenreDto): Promise<Genre> {
    return this.genresService.create(createGenreDto);
  }

  /**
   * Get all genres
   */
  @Get()
  @ApiOperation({ summary: 'Get all genres' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all genres',
    type: [Genre] 
  })
  async findAll(): Promise<Genre[]> {
    return this.genresService.findAll();
  }

  /**
   * Get a specific genre by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a genre by ID' })
  @ApiParam({ name: 'id', description: 'Genre ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the genre',
    type: Genre 
  })
  @ApiResponse({ status: 404, description: 'Genre not found.' })
  async findOne(@Param('id') id: string): Promise<Genre> {
    return this.genresService.findOne(id);
  }

  /**
   * Update a genre
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a genre' })
  @ApiParam({ name: 'id', description: 'Genre ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'The genre has been successfully updated.',
    type: Genre 
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Genre not found.' })
  async update(
    @Param('id') id: string, 
    @Body() updateGenreDto: UpdateGenreDto
  ): Promise<Genre> {
    return this.genresService.update(id, updateGenreDto);
  }

  /**
   * Delete a genre
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a genre' })
  @ApiParam({ name: 'id', description: 'Genre ID' })
  @ApiResponse({ status: 204, description: 'The genre has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Genre not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.genresService.remove(id);
  }

  /**
   * Get books in a specific genre
   */
  @Get(':id/books')
  @ApiOperation({ summary: 'Get books in a specific genre' })
  @ApiParam({ name: 'id', description: 'Genre ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the genre with related books',
    type: Genre 
  })
  @ApiResponse({ status: 404, description: 'Genre not found.' })
  async findBooksInGenre(@Param('id') id: string): Promise<Genre> {
    return this.genresService.findBooksInGenre(id);
  }
}
