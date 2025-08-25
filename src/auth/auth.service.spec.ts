import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let loggerSpy: jest.SpyInstance;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: 'hashed_password',
    role: 'user',
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    reviews: [],
  };

  beforeEach(async () => {
    // Create a spy on the Logger before the module is initialized
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            validateCredentials: jest.fn(),
            updateLastLogin: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test_token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should call usersService.validateCredentials with correct parameters', async () => {
      jest.spyOn(usersService, 'validateCredentials').mockResolvedValueOnce(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(usersService.validateCredentials).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result).toEqual(mockUser);
      expect(loggerSpy).toHaveBeenCalledWith('Validating user credentials for email: test@example.com');
    });

    it('should return null when credentials are invalid', async () => {
      jest.spyOn(usersService, 'validateCredentials').mockResolvedValueOnce(null);

      const result = await service.validateUser('test@example.com', 'wrong_password');

      expect(usersService.validateCredentials).toHaveBeenCalledWith('test@example.com', 'wrong_password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should update last login and generate a token', async () => {
      jest.spyOn(usersService, 'updateLastLogin').mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('test_token');

      const result = await service.login(mockUser);

      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result).toEqual({
        accessToken: 'test_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
          role: mockUser.role,
        },
      });
      expect(loggerSpy).toHaveBeenCalledWith(`Generating JWT token for user: ${mockUser.email}`);
    });

    it('should default role to user if not specified', async () => {
      const userWithoutRole = { ...mockUser, role: undefined };
      
      jest.spyOn(usersService, 'updateLastLogin').mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('test_token');

      const result = await service.login(userWithoutRole);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: userWithoutRole.email,
        sub: userWithoutRole.id,
        role: 'user', // Default role
      });
      expect(result.user.role).toBe('user');
    });
  });

  describe('register', () => {
    it('should create a new user and generate a token', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null);
      jest.spyOn(usersService, 'create').mockResolvedValueOnce(mockUser);
      jest.spyOn(service, 'login').mockImplementationOnce(async (user) => ({
        accessToken: 'test_token',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      }));

      const result = await service.register('test@example.com', 'password', 'Test User');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        displayName: 'Test User',
      });
      expect(service.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        accessToken: 'test_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
          role: mockUser.role,
        },
      });
      expect(loggerSpy).toHaveBeenCalledWith('Registering new user with email: test@example.com');
    });

    it('should throw UnauthorizedException if email is already in use', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(mockUser);

      await expect(
        service.register('test@example.com', 'password', 'Test User'),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });
});
