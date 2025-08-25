import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

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
    favorites: [],
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
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
            findAll: jest.fn().mockResolvedValue(mockUsers),
            findOne: jest.fn().mockImplementation((id: string) => {
              if (id === mockUser.id) {
                return Promise.resolve(mockUser);
              }
              return Promise.reject(new NotFoundException(`User with ID ${id} not found`));
            }),
            update: jest.fn().mockImplementation((id: string, dto: UpdateUserDto) => {
              if (id === mockUser.id) {
                return Promise.resolve({
                  ...mockUser,
                  ...dto,
                });
              }
              return Promise.reject(new NotFoundException(`User with ID ${id} not found`));
            }),
            remove: jest.fn().mockImplementation((id: string) => {
              if (id === mockUser.id) {
                return Promise.resolve();
              }
              return Promise.reject(new NotFoundException(`User with ID ${id} not found`));
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
      };

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should return a user when user exists', async () => {
      const result = await controller.findOne(mockUser.id);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(service.findOne).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('update', () => {
    it('should update a user when user is updating their own profile', async () => {
      const updateUserDto: UpdateUserDto = {
        displayName: 'Updated Name',
      };
      const req = {
        user: {
          id: mockUser.id,
          role: 'user',
        },
      };

      const result = await controller.update(mockUser.id, updateUserDto, req);

      expect(service.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
      expect(result).toEqual({
        ...mockUser,
        displayName: 'Updated Name',
      });
    });

    it('should update any user when requester is admin', async () => {
      const updateUserDto: UpdateUserDto = {
        displayName: 'Updated Name',
      };
      const req = {
        user: {
          id: '999e4567-e89b-12d3-a456-426614174999',
          role: 'admin',
        },
      };

      const result = await controller.update(mockUser.id, updateUserDto, req);

      expect(service.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
      expect(result).toEqual({
        ...mockUser,
        displayName: 'Updated Name',
      });
    });

    it('should throw error when user tries to update another user profile', async () => {
      const updateUserDto: UpdateUserDto = {
        displayName: 'Updated Name',
      };
      const req = {
        user: {
          id: '999e4567-e89b-12d3-a456-426614174999',
          role: 'user',
        },
      };

      await expect(controller.update(mockUser.id, updateUserDto, req)).rejects.toThrow(
        'You can only update your own profile',
      );

      expect(service.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user when user is removing their own profile', async () => {
      const req = {
        user: {
          id: mockUser.id,
          role: 'user',
        },
      };

      await controller.remove(mockUser.id, req);

      expect(service.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('should remove any user when requester is admin', async () => {
      const req = {
        user: {
          id: '999e4567-e89b-12d3-a456-426614174999',
          role: 'admin',
        },
      };

      await controller.remove(mockUser.id, req);

      expect(service.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error when user tries to remove another user profile', async () => {
      const req = {
        user: {
          id: '999e4567-e89b-12d3-a456-426614174999',
          role: 'user',
        },
      };

      await expect(controller.remove(mockUser.id, req)).rejects.toThrow(
        'You can only delete your own profile',
      );

      expect(service.remove).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return the current user profile', async () => {
      const req = {
        user: {
          id: mockUser.id,
        },
      };

      const result = await controller.getProfile(req);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });
  });
});
