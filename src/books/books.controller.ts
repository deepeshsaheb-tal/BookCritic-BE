import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiResponse, 
  ApiTags 
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Controller for book-related endpoints
 */
@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  /**
   * Create a new book
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({ 
    status: 201, 
    description: 'The book has been successfully created.',
    type: Book 
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createBookDto: CreateBookDto): Promise<Book> {
    return this.booksService.create(createBookDto);
  }

  /**
   * Get all books with pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all books' })
  @ApiQuery({ name: 'skip', description: 'Number of items to skip', required: false, type: Number })
  @ApiQuery({ name: 'take', description: 'Number of items to take', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all books',
    schema: {
      properties: {
        books: {
          type: 'array',
          items: { $ref: '#/components/schemas/Book' }
        },
        total: {
          type: 'number',
          example: 100
        }
      }
    }
  })
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
  ): Promise<{ books: Book[]; total: number }> {
    return this.booksService.findAll(skip, take);
  }

  /**
   * Search for books
   */
  @Get('search')
  @ApiOperation({ summary: 'Search for books by title, author, or ISBN' })
  @ApiQuery({ name: 'query', description: 'Search query', required: true, type: String })
  @ApiQuery({ name: 'skip', description: 'Number of items to skip', required: false, type: Number })
  @ApiQuery({ name: 'take', description: 'Number of items to take', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Return matching books',
    schema: {
      properties: {
        books: {
          type: 'array',
          items: { $ref: '#/components/schemas/Book' }
        },
        total: {
          type: 'number',
          example: 100
        }
      }
    }
  })
  async search(
    @Query('query') query: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
  ): Promise<{ books: Book[]; total: number }> {
    return this.booksService.search(query, skip, take);
  }

  /**
   * Get a specific book by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the book',
    type: Book 
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async findOne(@Param('id') id: string): Promise<Book> {
    return this.booksService.findOne(id);
  }

  /**
   * Update a book
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'The book has been successfully updated.',
    type: Book 
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async update(
    @Param('id') id: string, 
    @Body() updateBookDto: UpdateBookDto
  ): Promise<Book> {
    return this.booksService.update(id, updateBookDto);
  }

  /**
   * Delete a book
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 204, description: 'The book has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.booksService.remove(id);
  }
}
