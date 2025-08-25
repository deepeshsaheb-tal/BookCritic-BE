import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

// Mock argon2 module
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  verify: jest.fn(),
  argon2id: 'argon2id',
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

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

  const mockUsers = [
    mockUser,
    {
      ...mockUser,
      id: '223e4567-e89b-12d3-a456-426614174001',
      email: 'test2@example.com',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn().mockReturnValue(mockUser),
            save: jest.fn().mockResolvedValue(mockUser),
            find: jest.fn().mockResolvedValue(mockUsers),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
      };

      const result = await service.create(createUserDto);

      expect(argon2.hash).toHaveBeenCalledWith('password123', {
        type: 'argon2id',
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
      expect(repository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash: 'hashed_password',
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await service.findAll();
      
      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should return a user when user exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser);
      
      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');
      
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user when email exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser);
      
      const result = await service.findByEmail('test@example.com');
      
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when email does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      
      const result = await service.findByEmail('non-existent@example.com');
      
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'non-existent@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user when user exists', async () => {
      const updateUserDto: UpdateUserDto = {
        displayName: 'Updated Name',
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValueOnce({
        ...mockUser,
        displayName: 'Updated Name',
      });
      
      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateUserDto);
      
      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.save).toHaveBeenCalledWith({
        ...mockUser,
        displayName: 'Updated Name',
      });
      expect(result).toEqual({
        ...mockUser,
        displayName: 'Updated Name',
      });
    });

    it('should update password when provided', async () => {
      const updateUserDto: UpdateUserDto = {
        password: 'newpassword123',
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValueOnce({
        ...mockUser,
        passwordHash: 'hashed_password',
      });
      
      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateUserDto);
      
      expect(argon2.hash).toHaveBeenCalledWith('newpassword123', {
        type: 'argon2id',
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockUser,
        passwordHash: 'hashed_password',
      });
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const now = new Date();
      jest.spyOn(global, 'Date').mockImplementationOnce(() => now as any);
      
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValueOnce({
        ...mockUser,
        lastLogin: now,
      });
      
      const result = await service.updateLastLogin('123e4567-e89b-12d3-a456-426614174000');
      
      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.save).toHaveBeenCalledWith({
        ...mockUser,
        lastLogin: now,
      });
      expect(result).toEqual({
        ...mockUser,
        lastLogin: now,
      });
    });
  });

  describe('remove', () => {
    it('should remove a user when user exists', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'remove').mockResolvedValueOnce(mockUser);
      
      await service.remove('123e4567-e89b-12d3-a456-426614174000');
      
      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('validateCredentials', () => {
    it('should return user when credentials are valid', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValueOnce(true);
      
      const result = await service.validateCredentials('test@example.com', 'password123');
      
      expect(service.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(null);
      
      const result = await service.validateCredentials('non-existent@example.com', 'password123');
      
      expect(service.findByEmail).toHaveBeenCalledWith('non-existent@example.com');
      expect(argon2.verify).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValueOnce(false);
      
      const result = await service.validateCredentials('test@example.com', 'wrongpassword');
      
      expect(service.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null when verification throws an error', async () => {
      // Create a complete mock logger with all required methods
      const mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn()
      };
      Object.defineProperty(service, 'logger', { value: mockLogger });
      
      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(mockUser);
      jest.spyOn(argon2, 'verify').mockRejectedValueOnce(new Error('Verification error'));
      
      const result = await service.validateCredentials('test@example.com', 'password123');
      
      expect(service.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123');
      expect(result).toBeNull();
    });
  });
});
