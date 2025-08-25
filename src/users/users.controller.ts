import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  Query
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiResponse, 
  ApiTags 
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controller for user-related endpoints
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user
   */
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'The user has been successfully created.',
    type: User 
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  /**
   * Get all users
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all users',
    type: [User] 
  })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  /**
   * Get a specific user by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the user',
    type: User 
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  /**
   * Update a user
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'The user has been successfully updated.',
    type: User 
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any
  ): Promise<User> {
    // Only allow users to update their own profile unless they're an admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      throw new Error('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Delete a user
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'The user has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<void> {
    // Only allow users to delete their own profile unless they're an admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      throw new Error('You can only delete your own profile');
    }
    return this.usersService.remove(id);
  }

  /**
   * Get the current user's profile
   */
  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the current user profile',
    type: User 
  })
  async getProfile(@Request() req: any): Promise<User> {
    return this.usersService.findOne(req.user.id);
  }
}
