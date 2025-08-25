import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

/**
 * Service for authentication operations
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials
   * @param email - User email
   * @param password - User password
   * @returns User object if credentials are valid
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    this.logger.log(`Validating user credentials for email: ${email}`);
    return this.usersService.validateCredentials(email, password);
  }

  /**
   * Generate JWT token for authenticated user
   * @param user - User object
   * @returns Object containing access token
   */
  async login(user: User): Promise<{ accessToken: string; user: Partial<User> }> {
    this.logger.log(`Generating JWT token for user: ${user.email}`);
    
    // Update last login timestamp
    await this.usersService.updateLastLogin(user.id);
    
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role || 'user', // Default to 'user' if no role specified
    };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role || 'user',
      },
    };
  }

  /**
   * Register a new user
   * @param email - User email
   * @param password - User password
   * @param displayName - User display name
   * @returns Object containing access token
   */
  async register(email: string, password: string, displayName: string): Promise<{ accessToken: string; user: Partial<User> }> {
    this.logger.log(`Registering new user with email: ${email}`);
    
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }
    
    // Create new user
    const user = await this.usersService.create({
      email,
      password,
      displayName,
    });
    
    // Generate token
    return this.login(user);
  }
}
