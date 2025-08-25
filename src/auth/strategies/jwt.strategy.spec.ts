import { Test } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: 'hashedPassword',
    lastLogin: new Date(),
    reviews: [],
    favorites: [], // Adding favorites property for the User entity
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'user', // Adding this for the test even though it's not in the entity
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') {
                return 'test_secret';
              }
              return null;
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = moduleRef.get<JwtStrategy>(JwtStrategy);
    usersService = moduleRef.get<UsersService>(UsersService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from config service', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('validate', () => {
    it('should return user data when user exists', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'user',
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: payload.role,
      });
    });

    it('should default to "user" role when no role in payload', async () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: undefined,
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result.role).toBe('user');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = {
        sub: 'non-existent-id',
        email: 'nonexistent@example.com',
        role: 'user',
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('User not found');
    });
  });
});
