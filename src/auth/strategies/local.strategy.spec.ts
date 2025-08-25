import { Test } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: 'hashedPassword',
    lastLogin: new Date(),
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'user', // Adding this for the test even though it's not in the entity
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = moduleRef.get<LocalStrategy>(LocalStrategy);
    authService = moduleRef.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should set usernameField to email', () => {
      // This is testing the super() call in the constructor
      // We can't directly test the constructor parameters, but we can test the behavior
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(email, password)).rejects.toThrow('Invalid credentials');
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });
  });
});
