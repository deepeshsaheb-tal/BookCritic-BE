import { Controller, Post, Delete, Get, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserFavorite } from './entities/user-favorite.entity';

/**
 * Controller for managing user favorites
 */
@ApiTags('favorites')
@Controller('api/v1/favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * Add a book to user's favorites
   */
  @Post('books/:bookId')
  @ApiOperation({ summary: 'Add a book to favorites' })
  @ApiResponse({ status: 201, description: 'Book added to favorites successfully', type: UserFavorite })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 409, description: 'Book already in favorites' })
  @ApiParam({ name: 'bookId', description: 'Book ID to add to favorites' })
  async addFavorite(
    @Request() req: any,
    @Param('bookId') bookId: string,
  ): Promise<UserFavorite> {
    return this.favoritesService.addFavorite(req.user.id, bookId);
  }

  /**
   * Remove a book from user's favorites
   */
  @Delete('books/:bookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a book from favorites' })
  @ApiResponse({ status: 204, description: 'Book removed from favorites successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found in favorites' })
  @ApiParam({ name: 'bookId', description: 'Book ID to remove from favorites' })
  async removeFavorite(
    @Request() req: any,
    @Param('bookId') bookId: string,
  ): Promise<void> {
    return this.favoritesService.removeFavorite(req.user.id, bookId);
  }

  /**
   * Check if a book is in user's favorites
   */
  @Get('books/:bookId/check')
  @ApiOperation({ summary: 'Check if a book is in favorites' })
  @ApiResponse({ status: 200, description: 'Returns true if book is in favorites, false otherwise' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'bookId', description: 'Book ID to check' })
  async checkFavorite(
    @Request() req: any,
    @Param('bookId') bookId: string,
  ): Promise<{ isFavorite: boolean }> {
    const isFavorite = await this.favoritesService.isFavorite(req.user.id, bookId);
    return { isFavorite };
  }

  /**
   * Get all favorite books for the current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all favorite books for the current user' })
  @ApiResponse({ status: 200, description: 'List of favorite books', type: [UserFavorite] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFavorites(@Request() req: any): Promise<UserFavorite[]> {
    return this.favoritesService.getUserFavorites(req.user.id);
  }
}
