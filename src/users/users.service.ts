import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

/**
 * Service for managing user operations
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   * @param createUserDto - User creation data
   * @returns The created user entity
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, displayName, password } = createUserDto;
    
    // Hash the password using Argon2id (recommended by OWASP)
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MB
      timeCost: 2, // 2 iterations
      parallelism: 1,
    });
    
    const user = this.usersRepository.create({
      email,
      displayName,
      passwordHash,
    });
    
    this.logger.log(`Creating new user with email: ${email}`);
    return this.usersRepository.save(user);
  }

  /**
   * Find all users
   * @returns Array of user entities
   */
  async findAll(): Promise<User[]> {
    this.logger.log('Finding all users');
    return this.usersRepository.find();
  }

  /**
   * Find a user by ID
   * @param id - User ID
   * @returns User entity if found
   * @throws NotFoundException if user not found
   */
  async findOne(id: string): Promise<User> {
    this.logger.log(`Finding user with ID: ${id}`);
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      this.logger.warn(`User with ID ${id} not found`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  /**
   * Find a user by email
   * @param email - User email
   * @returns User entity if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Finding user with email: ${email}`);
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Update a user
   * @param id - User ID
   * @param updateUserDto - User update data
   * @returns Updated user entity
   * @throws NotFoundException if user not found
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);
    const user = await this.findOne(id);
    
    // Handle password update separately to hash it
    if (updateUserDto.password) {
      user.passwordHash = await argon2.hash(updateUserDto.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
      
      // Create a new object without the password property instead of using delete
      const { password, ...restOfDto } = updateUserDto;
      updateUserDto = restOfDto as UpdateUserDto;
    }
    
    // Update other fields
    Object.assign(user, updateUserDto);
    
    return this.usersRepository.save(user);
  }

  /**
   * Update user's last login timestamp
   * @param id - User ID
   * @returns Updated user entity
   */
  async updateLastLogin(id: string): Promise<User> {
    this.logger.log(`Updating last login for user with ID: ${id}`);
    const user = await this.findOne(id);
    
    user.lastLogin = new Date();
    return this.usersRepository.save(user);
  }

  /**
   * Remove a user
   * @param id - User ID
   * @returns Void
   * @throws NotFoundException if user not found
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removing user with ID: ${id}`);
    const user = await this.findOne(id);
    
    await this.usersRepository.remove(user);
  }

  /**
   * Validate user credentials
   * @param email - User email
   * @param password - User password
   * @returns User entity if credentials are valid, null otherwise
   */
  async validateCredentials(email: string, password: string): Promise<User | null> {
    this.logger.log(`Validating credentials for user with email: ${email}`);
    const user = await this.findByEmail(email);
    
    if (!user) {
      return null;
    }
    
    try {
      const isPasswordValid = await argon2.verify(user.passwordHash, password);
      return isPasswordValid ? user : null;
    } catch (error) {
      this.logger.error(`Error validating password: ${error.message}`);
      return null;
    }
  }
}
